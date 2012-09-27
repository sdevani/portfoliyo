var PYO = (function (PYO, $) {

    'use strict';

    var postAjax = {
        XHR: {},
        count: 0
    };
    var feedAjax = {
        XHR: null,
        count: 0
    };

    PYO.renderPost = function (data) {
        var posts;
        if (data) {
            posts = ich.post(data);
        }
        if (posts) {
            var nametag = posts.find('.nametag');
            nametag.each(function () {
                var thisTag = $(this);
                var userID = thisTag.data('user-id');
                if (userID) {
                    var mentions = userID.toString().split(',');
                    if ($.inArray(PYO.activeUserId.toString(), mentions) !== -1) {
                        thisTag.addClass('me');
                    }
                }
            });
            posts.filter('.post[data-author-id="' + PYO.activeUserId + '"]').addClass('mine');
            return posts;
        }
    };

    PYO.addPost = function (data) {
        if (data) {
            var posts = PYO.renderPost(data);
            $('.village-feed').append(posts);
            return posts;
        }
    };

    PYO.replacePost = function (data) {
        if (data && data.posts[0] && data.posts[0].author_sequence_id && data.posts[0].author_id) {
            var feed = $('.village-feed');
            var author_sequence_id = data.posts[0].author_sequence_id;
            var author_id = data.posts[0].author_id;
            var oldPost = feed.find('.post[data-author-id="' + author_id + '"][data-author-sequence="' + author_sequence_id + '"]');
            if (oldPost && oldPost.length) {
                var newPost = PYO.renderPost(data);
                oldPost.replaceWith(newPost);
                $.doTimeout('new-post-' + author_sequence_id);
                return true;
            }
        }
    };

    PYO.createPostObj = function (author_sequence, xhr_count) {
        var feed = $('.village-feed');
        var textarea = $('#post-text');
        var author = feed.data('author');
        var role = feed.data('author-role');
        var today = new Date();
        var day = today.getDate();
        var month = today.getMonth() + 1;
        var year = today.getFullYear();
        var date = month + '/' + day + '/' + year;
        var hour = today.getHours();
        var minute = today.getMinutes();
        minute = (minute < 10) ? '0' + minute : minute;
        var period = (hour > 12) ? 'p.m.' : 'a.m.';
        hour = (hour > 12) ? hour - 12 : hour;
        var time = hour + ':' + minute + ' ' + period;
        var text = $.trim(textarea.val());
        var postObj = {
            posts: {
                author: author,
                author_id: PYO.activeUserId,
                role: role,
                date: date,
                time: time,
                text: text,
                author_sequence_id: author_sequence,
                xhr_count: xhr_count,
                local: true,
                escape: true
            }
        };
        return postObj;
    };

    PYO.submitPost = function (container) {
        if ($(container).length) {
            var feed = $(container);
            var context = feed.closest('.village');
            var form = context.find('form.post-add-form');
            var button = form.find('.action-post');
            var textarea = form.find('#post-text');

            form.submit(function (event) {
                event.preventDefault();
                if (textarea.val().length) {
                    var text = $.trim(textarea.val());
                    var author_sequence_id = ++PYO.authorPosts;
                    var url = feed.data('post-url');
                    var count = ++postAjax.count;
                    var postObj = PYO.createPostObj(author_sequence_id, count);
                    var post = PYO.addPost(postObj);
                    var postData = {
                        text: text,
                        author_sequence_id: author_sequence_id
                    };

                    if (url) {
                        postAjax.XHR[count] = $.post(url, postData, function (response) {
                            PYO.postAjaxSuccess(response, author_sequence_id, count);
                        }).error(function (request, status, error) {
                            PYO.postAjaxError(post, author_sequence_id, status, count);
                            postAjax.XHR[count] = null;
                        });
                    }

                    textarea.val('').change();
                    PYO.scrollToBottom('.village-feed');
                    PYO.addPostTimeout(post, author_sequence_id, count);
                }
            });

            textarea.keydown(function (event) {
                if (event.keyCode === PYO.keycodes.ENTER && !event.shiftKey) {
                    event.preventDefault();
                    if (!button.is(':disabled')) {
                        form.submit();
                    }
                }
            });
        }
    };

    PYO.postAjaxSuccess = function (response, old_author_sequence, xhr_count) {
        if (response && response.posts[0] && response.posts[0].student_id && response.posts[0].student_id === PYO.activeStudentId) {
            if (response.posts[0].author_sequence_id) {
                var feed = $('.village-feed');
                var author_sequence_id = response.posts[0].author_sequence_id;
                var oldPost = feed.find('.post.mine[data-author-sequence="' + author_sequence_id + '"]');
                if (oldPost && oldPost.length) {
                    oldPost.loadingOverlay('remove');
                }
            }
            if (response.success && !PYO.pusherKey) {
                PYO.replacePost(response);
            }
        }
        PYO.removePostTimeout(old_author_sequence);
        postAjax.XHR[xhr_count] = null;
    };

    PYO.postAjaxError = function (post, author_sequence_id, status, xhr_count) {
        if (status !== 'abort' && status !== 'timeout') {
            var msg = ich.post_timeout_msg();
            msg.find('.resend').click(function (e) {
                e.preventDefault();
                var thisPost = $(this).closest('.post');
                PYO.resendPost(thisPost);
                if (postAjax.XHR[xhr_count]) { postAjax.XHR[xhr_count].abort(); }
            });
            msg.find('.cancel').click(function (e) {
                e.preventDefault();
                post.remove();
                if (postAjax.XHR[xhr_count]) { postAjax.XHR[xhr_count].abort(); }
            });
            post.addClass('not-posted').prepend(msg).loadingOverlay('remove');
            PYO.scrollToBottom('.village-feed');
            PYO.removePostTimeout(author_sequence_id);
        }
    };

    PYO.removePostTimeout = function (author_sequence_id) {
        $.doTimeout('new-post-' + author_sequence_id);
    };

    PYO.addPostTimeout = function (post, author_sequence_id, xhr_count) {
        $.doTimeout('new-post-' + author_sequence_id, 10000, function () {
            PYO.postAjaxError(post, author_sequence_id, 'warning', xhr_count);
        });
    };

    PYO.resendPost = function (post) {
        var feed = $('.village-feed');
        var url = feed.data('post-url');
        var author_sequence_id = post.data('author-sequence');
        var text = $.trim(post.find('.post-text').text());
        var postData = {
            author_sequence_id: author_sequence_id,
            text: text
        };
        var count = ++postAjax.count;

        if (url) {
            postAjax.XHR[count] = $.post(url, postData, function (response) {
                PYO.postAjaxSuccess(response, author_sequence_id, count);
            }).error(function (request, status, error) {
                PYO.postAjaxError(post, author_sequence_id, status, count);
                postAjax.XHR[count] = null;
            });
        }

        post.find('.timeout').remove();
        post.loadingOverlay();
        PYO.addPostTimeout(post, author_sequence_id, count);
    };

    PYO.listenForPosts = function (container) {
        if ($(container).length && PYO.pusherKey) {
            var pusher = new Pusher(PYO.pusherKey, {encrypted: true});
            var students = $('.village-nav .student a');

            students.each(function () {
                var el = $(this);
                var id = el.data('id');
                var unread = el.find('.unread');
                var channel = pusher.subscribe('student_' + id);

                channel.bind('message_posted', function (data) {
                    if (id === PYO.activeStudentId) {
                        var scroll = PYO.scrolledToBottom('.village-feed');
                        if (!PYO.replacePost(data)) {
                            PYO.addPost(data);
                            if (scroll) { PYO.scrollToBottom('.village-feed'); }
                        }
                    } else {
                        var count = parseInt(unread.text(), 10);
                        unread.removeClass('zero').text(++count);
                    }
                });
            });
        }
    };

    PYO.fetchBacklog = function (container) {
        if (feedAjax.XHR) { feedAjax.XHR.abort(); }
        if ($(container).length) {
            var feed = $(container);
            var context = feed.closest('.village-main');
            var url = feed.data('backlog-url');
            var count = ++feedAjax.count;
            var loadFeed = function () {
                if (url) {
                    context.loadingOverlay();
                    feedAjax.XHR = $.get(url, function (response) {
                        context.loadingOverlay('remove');
                        if (response && feedAjax.count === count) {
                            PYO.addPost(response);
                            PYO.scrollToBottom('.village-feed');
                            PYO.authorPosts = feed.find('.post.mine').length;
                        }
                        feedAjax.XHR = null;
                    }).error(function (request, status, error) {
                        if (status !== 'abort') {
                            var msg = ich.feed_error_msg();
                            msg.find('.reload-feed').click(function (e) {
                                e.preventDefault();
                                msg.remove();
                                loadFeed();
                            });
                            feed.prepend(msg);
                        }
                        context.loadingOverlay('remove');
                        feedAjax.XHR = null;
                    });
                }
            };

            loadFeed();
        }
    };

    PYO.characterCount = function (container) {
        if ($(container).length) {
            var context = $(container);
            var form = context.find('form.post-add-form');
            var textarea = form.find('#post-text');
            var limit = form.data('char-limit');
            var count = form.find('.charcount');
            var button = form.find('.action-post');
            var updateCount = function () {
                var chars = $.trim(textarea.val()).length;
                var remain = limit - chars;
                if (remain < 0) {
                    count.addClass('overlimit');
                    button.attr('disabled', 'true');
                } else {
                    count.removeClass('overlimit');
                    button.removeAttr('disabled');
                }
                count.text(remain + ' characters remaining...');
            };

            textarea.keyup(updateCount).change(updateCount);
        }
    };

    return PYO;

}(PYO || {}, jQuery));