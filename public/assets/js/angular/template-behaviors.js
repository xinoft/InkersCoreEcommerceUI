window.InkersTemplateMount = function(scope) {
const $=scope.$, jQuery=$, setTimeout=scope.setTimeout, setInterval=scope.setInterval, clearTimeout=scope.clearTimeout, clearInterval=scope.clearInterval, requestAnimationFrame=scope.requestAnimationFrame, IntersectionObserver=scope.IntersectionObserver;

/* Original template: vendor/jquery-appear.js */
/*
 * jQuery.appear
 * https://github.com/bas2k/jquery.appear/
 * http://code.google.com/p/jquery-appear/
 * http://bas2k.ru/
 *
 * Copyright (c) 2009 Michael Hixson
 * Copyright (c) 2012-2014 Alexander Brovikov
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
 */
(function ($) {
    $.fn.appear = function (fn, options) {

        var settings = $.extend({

            //arbitrary data to pass to fn
            data: undefined,

            //call fn only on the first appear?
            one: true,

            // X & Y accuracy
            accX: 0,
            accY: 0

        }, options);

        return this.each(function () {

            var t = $(this);

            //whether the element is currently visible
            t.appeared = false;

            if (!fn) {

                //trigger the custom event
                t.trigger('appear', settings.data);
                return;
            }

            var w = $(window);

            //fires the appear event when appropriate
            var check = function () {

                //is the element hidden?
                if (!t.is(':visible')) {

                    //it became hidden
                    t.appeared = false;
                    return;
                }

                //is the element inside the visible window?
                var a = w.scrollLeft();
                var b = w.scrollTop();
                var o = t.offset();
                var x = o.left;
                var y = o.top;

                var ax = settings.accX;
                var ay = settings.accY;
                var th = t.height();
                var wh = w.height();
                var tw = t.width();
                var ww = w.width();

                if (y + th + ay >= b &&
                    y <= b + wh + ay &&
                    x + tw + ax >= a &&
                    x <= a + ww + ax) {

                    //trigger the custom event
                    if (!t.appeared) t.trigger('appear', settings.data);

                } else {

                    //it scrolled out of view
                    t.appeared = false;
                }
            };

            //create a modified fn with some additional logic
            var modifiedFn = function () {

                //mark the element as visible
                t.appeared = true;

                //is this supposed to happen only once?
                if (settings.one) {

                    //remove the check
                    w.unbind('scroll', check);
                    var i = $.inArray(check, $.fn.appear.checks);
                    if (i >= 0) $.fn.appear.checks.splice(i, 1);
                }

                //trigger the original fn
                fn.apply(this, arguments);
            };

            //bind the modified fn to the element
            if (settings.one) t.one('appear', settings.data, modifiedFn);
            else t.bind('appear', settings.data, modifiedFn);

            //check whenever the window scrolls
            w.scroll(check);

            //check whenever the dom changes
            if (!$.fn.appear.checks) {
                $.fn.appear.checks = [];
            }

            $.fn.appear.checks.push(check);

            //check now
            (check)();
        });
    };

    //keep a queue of appearance checks
    $.extend($.fn.appear, {

        checks: [],
        timeout: null,

        //process the queue
        checkAll: function () {
            var length = $.fn.appear.checks.length;
            if (length > 0) {
                for (var i = 0; i < length; i++) {
                    var checkFn = $.fn.appear.checks[i];
                    if (typeof checkFn === 'function') {
                        checkFn();
                    } else {
                        console.warn('Item at index ' + i + ' is not a function');
                    }
                }
            }
        },

        //check the queue asynchronously
        run: function () {
            if ($.fn.appear.timeout) clearTimeout($.fn.appear.timeout);
            $.fn.appear.timeout = setTimeout($.fn.appear.checkAll, 20);
        }
    });

    //run checks when these methods are called
    $.each(['append', 'prepend', 'after', 'before', 'attr',
        'removeAttr', 'addClass', 'removeClass', 'toggleClass',
        'remove', 'css', 'show', 'hide'], function (i, n) {
            var old = $.fn[n];
            if (old) {
                $.fn[n] = function () {
                    var r = old.apply(this, arguments);
                    $.fn.appear.run();
                    return r;
                }
            }
        });

})(jQuery);


/* Original template: vendor/animation.js */
/*
 * RBT Animation JS
 * (c) 2025 Sabbir Hossen
 * Released under the RBT license
 */

// Class names for different scroll and animation states
const RBT_SCROLL_ACTIVATION = "rbt-scroll-trigger",
    RBT_SCROLL_OFFSCREEN_ACTIVATION = "rbt-scroll-trigger--offscreen",
    RBT_SCROLL_ZOOM_IN_ACTIVATION = "animate--zoom-in",
    RBT_SCROLL_CANCEL_ACTIVATION = "rbt-scroll-trigger--cancel";

// Handle intersection events for scroll animations
function onIntersection(entries, observer) {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            const elementTarget = entry.target;
            if ($(elementTarget).hasClass(RBT_SCROLL_OFFSCREEN_ACTIVATION)) {
                $(elementTarget).removeClass(RBT_SCROLL_OFFSCREEN_ACTIVATION);
                if ($(elementTarget).attr("data-cascade")) {
                    $(elementTarget).css("--animation-order", index);
                }
            }
            observer.unobserve(elementTarget);
        } else {
            $(entry.target).addClass(RBT_SCROLL_OFFSCREEN_ACTIVATION);
            $(entry.target).removeClass(RBT_SCROLL_CANCEL_ACTIVATION);
        }
    });
}

// Initialize scroll animation triggers
function initializeScrollAnimationTrigger(rootEl = document, isDesignModeEvent = false) {
    const animationTriggerElements = $(rootEl).find(`.${RBT_SCROLL_ACTIVATION}`);
    if (animationTriggerElements.length === 0) return;

    if (isDesignModeEvent) {
        animationTriggerElements.each(function() {
            $(this).addClass("rbt-scroll-trigger--design-mode");
        });
        return;
    }

    const observer = new IntersectionObserver(onIntersection, {
        rootMargin: "0px 0px -50px 0px"
    });
    animationTriggerElements.each(function() {
        observer.observe(this);
    });
}

// Initialize zoom-in animation triggers
function initializeScrollZoomAnimationTrigger() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animationTriggerElements = $(`.${RBT_SCROLL_ZOOM_IN_ACTIVATION}`);
    if (animationTriggerElements.length === 0) return;

    const scaleAmount = 0.2 / 100;
    const visibleElements = new Set();
    const zoomElements = animationTriggerElements.toArray();

    const zoomVisibilityObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                visibleElements.add(entry.target);
            } else {
                visibleElements.delete(entry.target);
            }
        });
    });

    zoomElements.forEach(element => {
        zoomVisibilityObserver.observe(element);
        $(element).css("--zoom-in-ratio", 1 + scaleAmount * percentageSeen(element));
    });

    const updateVisibleZoomElements = throttle(() => {
        visibleElements.forEach(element => {
            $(element).css("--zoom-in-ratio", 1 + scaleAmount * percentageSeen(element));
        });
    }, 100);

    // Ensure this initializer does not create duplicate listeners on reinits.
    window.removeEventListener("scroll", window.__rbtZoomInScrollHandler);
    window.__rbtZoomInScrollHandler = updateVisibleZoomElements;
    scope.windowListener("scroll", updateVisibleZoomElements, {
        passive: true
    });
}

// Calculate the percentage of the element that is visible
function percentageSeen(element) {
    const viewportHeight = window.innerHeight,
        scrollY = window.scrollY,
        elementPositionY = $(element).offset().top,
        elementHeight = $(element).outerHeight();

    if (elementPositionY > scrollY + viewportHeight) return 0;
    if (elementPositionY + elementHeight < scrollY) return 100;

    let percentage = (scrollY + viewportHeight - elementPositionY) / ((viewportHeight + elementHeight) / 100);
    return Math.round(percentage);
}

// Initialize animations and remove initial opacity class from swiper slides
$(document).ready(() => {
    $(".swiper-slide.opacity-0").each(function() {
        $(this).removeClass("opacity-0");
    });
    initializeScrollAnimationTrigger();
    initializeScrollZoomAnimationTrigger();
});

// Throttle the scroll event to improve performance
function throttle(fn, wait) {
    let time = Date.now();
    return function() {
        if ((time + wait - Date.now()) < 0) {
            fn();
            time = Date.now();
        }
    }
}


/* Original template: vendor/text-type.js */
jQuery(document).ready(function ($) {
    //set animation timing
    var animationDelay = 2500,
        //loading bar effect
        barAnimationDelay = 3800,
        barWaiting = barAnimationDelay - 3000, //3000 is the duration of the transition on the loading bar - set in the scss/css file
        //letters effect
        lettersDelay = 50,
        //type effect
        typeLettersDelay = 150,
        selectionDuration = 500,
        typeAnimationDelay = selectionDuration + 800,
        //clip effect 
        revealDuration = 600,
        revealAnimationDelay = 1500;

    initHeadline();

    function initHeadline() {
        //insert <i> element for each letter of a changing word
        singleLetters($('.cd-headline.letters').find('b'));
        //initialise headline animation
        animateHeadline($('.cd-headline'));
    }

    function singleLetters($words) {
        $words.each(function () {
            var word = $(this),
                letters = word.text().split(''),
                selected = word.hasClass('is-visible');
            for (i in letters) {
                if (word.parents('.rotate-2').length > 0) letters[i] = '<em>' + letters[i] + '</em>';
                letters[i] = (selected) ? '<i class="in">' + letters[i] + '</i>' : '<i>' + letters[i] + '</i>';
            }
            var newLetters = letters.join('');
            word.html(newLetters).css('opacity', 1);
        });
    }

    function animateHeadline($headlines) {
        var duration = animationDelay;
        $headlines.each(function () {
            var headline = $(this);

            if (headline.hasClass('loading-bar')) {
                duration = barAnimationDelay;
                setTimeout(function () {
                    headline.find('.cd-words-wrapper').addClass('is-loading')
                }, barWaiting);
            } else if (headline.hasClass('clip')) {
                var spanWrapper = headline.find('.cd-words-wrapper'),
                    newWidth = spanWrapper.width() + 10
                spanWrapper.css('width', newWidth);
            } else if (!headline.hasClass('type')) {
                //assign to .cd-words-wrapper the width of its longest word
                var words = headline.find('.cd-words-wrapper b'),
                    width = 0;
                words.each(function () {
                    var wordWidth = $(this).width();
                    if (wordWidth > width) width = wordWidth;
                });
                headline.find('.cd-words-wrapper').css('width', width);
            };

            //trigger animation
            setTimeout(function () {
                hideWord(headline.find('.is-visible').eq(0))
            }, duration);
        });
    }

    function hideWord($word) {
        var nextWord = takeNext($word);

        if ($word.parents('.cd-headline').hasClass('type')) {
            var parentSpan = $word.parent('.cd-words-wrapper');
            parentSpan.addClass('selected').removeClass('waiting');
            setTimeout(function () {
                parentSpan.removeClass('selected');
                $word.removeClass('is-visible').addClass('is-hidden').children('i').removeClass('in').addClass('out');
            }, selectionDuration);
            setTimeout(function () {
                showWord(nextWord, typeLettersDelay)
            }, typeAnimationDelay);

        } else if ($word.parents('.cd-headline').hasClass('letters')) {
            var bool = ($word.children('i').length >= nextWord.children('i').length) ? true : false;
            hideLetter($word.find('i').eq(0), $word, bool, lettersDelay);
            showLetter(nextWord.find('i').eq(0), nextWord, bool, lettersDelay);

        } else if ($word.parents('.cd-headline').hasClass('clip')) {
            $word.parents('.cd-words-wrapper').animate({
                width: '2px'
            }, revealDuration, function () {
                switchWord($word, nextWord);
                showWord(nextWord);
            });

        } else if ($word.parents('.cd-headline').hasClass('loading-bar')) {
            $word.parents('.cd-words-wrapper').removeClass('is-loading');
            switchWord($word, nextWord);
            setTimeout(function () {
                hideWord(nextWord)
            }, barAnimationDelay);
            setTimeout(function () {
                $word.parents('.cd-words-wrapper').addClass('is-loading')
            }, barWaiting);

        } else {
            switchWord($word, nextWord);
            setTimeout(function () {
                hideWord(nextWord)
            }, animationDelay);
        }
    }

    function showWord($word, $duration) {
        if ($word.parents('.cd-headline').hasClass('type')) {
            showLetter($word.find('i').eq(0), $word, false, $duration);
            $word.addClass('is-visible').removeClass('is-hidden');

        } else if ($word.parents('.cd-headline').hasClass('clip')) {
            $word.parents('.cd-words-wrapper').animate({
                'width': $word.width() + 10
            }, revealDuration, function () {
                setTimeout(function () {
                    hideWord($word)
                }, revealAnimationDelay);
            });
        }
    }

    function hideLetter($letter, $word, $bool, $duration) {
        $letter.removeClass('in').addClass('out');

        if (!$letter.is(':last-child')) {
            setTimeout(function () {
                hideLetter($letter.next(), $word, $bool, $duration);
            }, $duration);
        } else if ($bool) {
            setTimeout(function () {
                hideWord(takeNext($word))
            }, animationDelay);
        }

        if ($letter.is(':last-child') && $('html').hasClass('no-csstransitions')) {
            var nextWord = takeNext($word);
            switchWord($word, nextWord);
        }
    }

    function showLetter($letter, $word, $bool, $duration) {
        $letter.addClass('in').removeClass('out');

        if (!$letter.is(':last-child')) {
            setTimeout(function () {
                showLetter($letter.next(), $word, $bool, $duration);
            }, $duration);
        } else {
            if ($word.parents('.cd-headline').hasClass('type')) {
                setTimeout(function () {
                    $word.parents('.cd-words-wrapper').addClass('waiting');
                }, 200);
            }
            if (!$bool) {
                setTimeout(function () {
                    hideWord($word)
                }, animationDelay)
            }
        }
    }

    function takeNext($word) {
        return (!$word.is(':last-child')) ? $word.next() : $word.parent().children().eq(0);
    }

    function takePrev($word) {
        return (!$word.is(':first-child')) ? $word.prev() : $word.parent().children().last();
    }

    function switchWord($oldWord, $newWord) {
        $oldWord.removeClass('is-visible').addClass('is-hidden');
        $newWord.removeClass('is-hidden').addClass('is-visible');
    }
});

/* Original template: vendor/backtotop.js */
if (document.querySelector('.rbt-progress-parent path')) {
!function(o){"use strict";o(document).ready(function(){var r=document.querySelector(".rbt-progress-parent path"),n=r.getTotalLength();r.style.transition=r.style.WebkitTransition="none",r.style.strokeDasharray=n+" "+n,r.style.strokeDashoffset=n,r.getBoundingClientRect(),r.style.transition=r.style.WebkitTransition="stroke-dashoffset 10ms linear";function t(){var t=o(window).scrollTop(),e=o(document).height()-o(window).height();r.style.strokeDashoffset=n-t*n/e}t(),o(window).scroll(t);jQuery(window).on("scroll",function(){50<jQuery(this).scrollTop()?jQuery(".rbt-progress-parent").addClass("rbt-backto-top-active"):jQuery(".rbt-progress-parent").removeClass("rbt-backto-top-active")}),jQuery(".rbt-progress-parent").on("click",function(t){return t.preventDefault(),jQuery("html, body").animate({scrollTop:0},550),!1})})}(jQuery);
}

/* Original template: vendor/countdown.js */
!function(c){function e(n){return n<10?"0"+n:n}c.fn.showclock=function(){var n=new Date,o=c(this).data("date").split("-"),s=[0,0];if(null!=c(this).data("time")&&(s=c(this).data("time").split(":")),(a=new Date(o[0],o[1]-1,o[2],s[0],s[1]).getTime()/1e3-n.getTime()/1e3)<=0||isNaN(a))return this.hide(),this;var t=Math.floor(a/86400);a%=86400;o=Math.floor(a/3600);a%=3600;var s=Math.floor(a/60),a=Math.floor(a%60),n="";0!=t&&(n+="<div class='countdown-container days'>",n+="<span class='countdown-value days-bottom'>"+e(t)+"</span>",n+="<span class='countdown-heading days-top'>Days</span>",n+="</div>"),n+="<div class='countdown-container hours'>",n+="<span class='countdown-value hours-bottom'>"+e(o)+"</span>",n+="<span class='countdown-heading hours-top'>Hrs</span>",n+="</div>",n+="<div class='countdown-container minutes'>",n+="<span class='countdown-value minutes-bottom'>"+e(s)+"</span>",n+="<span class='countdown-heading minutes-top'>Mins</span>",n+="</div>",n+="<div class='countdown-container seconds'>",n+="<span class='countdown-value seconds-bottom'>"+e(a)+"</span>",n+="<span class='countdown-heading seconds-top'>Secs</span>",this.html(n+="</div>")},c.fn.countdown=function(){var n=c(this);n.showclock(),setInterval(function(){n.showclock()},1e3)}}(jQuery),jQuery(document).ready(function(){0<jQuery(".countdown").length&&jQuery(".countdown").each(function(){jQuery(this).countdown()})});





/* Original template: plugins/color-swatches.js */
/**
 * RBT Variation JS
 * © 2025 Sabbir Hossen and Hemal Akhand
 * Released under the RBT License
 */

(function (window, document, $, undefined) {
    'use strict';
    var rbtJs = {
        i: function (e) {
            rbtJs.d();
            rbtJs.methods();
        },

        d: function (e) {
            this._window = $(window),
                this._document = $(document),
                this._body = $('body'),
                this._html = $('html')
        },
        methods: function (e) {
            if ($('.rbt-product-variations').length > 0) {
                rbtJs.productVariations();
            }
        },

        productVariations: function () {

            /**
             * ===========================================
             * Generate Variation Markup.
             * ===========================================
             **/

            function normalizeText(value, fallback) {
                if (value === null || value === undefined || value === '') {
                    return fallback || '';
                }

                return String(value);
            }

            function escapeHtml(value) {
                return normalizeText(value)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            }

            function sanitizeUrl(value, fallback) {
                var safeUrl = normalizeText(value, fallback).trim();

                if (!safeUrl) {
                    return '';
                }

                if (/^(?:javascript|vbscript):/i.test(safeUrl)) {
                    return normalizeText(fallback).trim();
                }

                if (/^data:/i.test(safeUrl) && !/^data:image\//i.test(safeUrl)) {
                    return normalizeText(fallback).trim();
                }

                return safeUrl;
            }

            function sanitizeColor(value, fallback) {
                var safeColor = normalizeText(value, fallback).trim();

                if (!safeColor || /[;"'<>]/.test(safeColor)) {
                    return normalizeText(fallback).trim();
                }

                if (window.CSS && typeof window.CSS.supports === 'function') {
                    return window.CSS.supports('color', safeColor) ? safeColor : normalizeText(fallback).trim();
                }

                if (
                    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(safeColor) ||
                    /^rgba?\([^)]{1,64}\)$/.test(safeColor) ||
                    /^hsla?\([^)]{1,64}\)$/.test(safeColor) ||
                    /^[a-zA-Z]{3,20}$/.test(safeColor)
                ) {
                    return safeColor;
                }

                return normalizeText(fallback).trim();
            }

            function parseVariationData(rawValue) {
                if (typeof rawValue !== 'string' || rawValue.length === 0) {
                    return null;
                }

                try {
                    return JSON.parse(rawValue);
                } catch (error) {
                    return null;
                }
            }

            function getVariationData($element) {
                if (!$element || !$element.length) {
                    return null;
                }

                var cachedData = $element.data('variations');
                if (cachedData && typeof cachedData === 'object') {
                    return cachedData;
                }

                return parseVariationData($element.attr('data-variations'));
            }

            function formatPriceValue(value) {
                var numericValue = Number(value);

                if (!isFinite(numericValue)) {
                    return '';
                }

                return numericValue % 1 === 0 ? String(numericValue) : numericValue.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
            }

            // generate color variation markup.
            function generateColorVariationMarkup(singleType, type, variation = 'variation-1') {
                const attributes = singleType.attributes;
                let html = '';
                if ('variation-1' === variation) {
                    html += `<div class="rbt-color-select-area" data-variation_key="${escapeHtml(type)}" data-type="list">`;
                    html += '<ul class="rbt-switcher-root rbt-switcher-color-list rbt-switcher-color-list-lg product-switcher-activation">';

                    attributes.forEach((attribute) => {
                        const color = escapeHtml(normalizeText(attribute.color));
                        const colorStyle = escapeHtml(sanitizeColor(attribute.color, '#d9d9d9'));
                        const label = escapeHtml(normalizeText(attribute.label, 'Color'));
                        html += `
                            <li><a class="rbt-switcher--color tooltips"
                                data-tooltip="${label}" data-tooltip-position="top" href="#0" data-value="${color}">
                                <div class="rbt-color-circle" style="background-color: ${colorStyle}"></div>
                            </a></li>
                            `;
                    });
                    html += '</ul>';
                    html += '</div>';
                }

                return html;
            }

            // generate dropdown variation markup.
            function generateDropdownVariationMarkup(singleType, type, variation = 'variation-1') {
                let html = '';
                const attributes = singleType.attributes;
                if ('variation-1' === variation) {
                    html += `<div data-type="select" data-variation_key="${escapeHtml(type)}" class="rbt-modern-select single-prd-select height-36 rbt-rounded-styled rbt-modern-select-md-width rbt-modern-select-md-width">`;
                    html += '<select class="rbt-switcher-root rbt-select-activation">';
                    attributes.forEach((attribute) => {
                        const label = escapeHtml(normalizeText(attribute.label, 'Option'));
                        const slug = escapeHtml(normalizeText(attribute.slug));
                        html += `<option value="${slug}" data-value="${slug}">${label}</option>`;

                    });
                    html += '</select>';
                    html += '</div>';
                }

                return html;
            }

            // generate button variation markup.
            function generateButtonVariationMarkup(singleType, type, variation = "variation-1") {
                let html = '';
                let attributes = singleType.attributes;
                if ('variation-1' === variation) {
                    html += `<div data-type="list" data-variation_key="${escapeHtml(type)}" class="rbt-product-switch-area">`;
                    html += '<ul class="rbt-switcher-root rbt-switcher-product-list product-switcher-activation">';
                    attributes.forEach((attribute) => {
                        const label = escapeHtml(normalizeText(attribute.label, 'Image'));
                        const slug = escapeHtml(normalizeText(attribute.slug));
                        if ('variation-1' === variation) {
                            html += `<li>`;
                            html += `<a data-value="${slug}" class="rbt-btn rbt-btn-border rbt-btn-xs rbt-store-button" href="#0">
                                                        <span class="rbt-store-radio-button">${label}</span>
                                                </a>`;
                            html += '</li>';
                        }
                    });
                    html += '</ul>';
                    html += '</div>';
                }

                return html;
            }

            // generate image variation markup.
            function generateImageVariationMarkup(singleType, type, variation = 'variation-1') {
                let html = '';
                let attributes = singleType.attributes;
                if ('variation-1' === variation) {
                    html += `<div data-type="list" data-variation_key="${escapeHtml(type)}" class="rbt-product-switch-area">`;
                    html += '<ul class="rbt-switcher-root rbt-switcher-product-list product-switcher-activation">';
                    attributes.forEach((attribute) => {
                        const image_url = escapeHtml(normalizeText(attribute.image_url));
                        const safeImageUrl = escapeHtml(sanitizeUrl(attribute.image_url, 'assets/images/system/placeholder.png'));
                        const alt = escapeHtml(normalizeText(attribute.alt, 'Image'));
                        const label = escapeHtml(normalizeText(attribute.label, 'Image'));
                        if ('variation-1' === variation) {
                            html += `<li>`;
                            html += `<a data-value="${image_url}" class="rbt-switcher--prd rbt-bg-color-brand-100 rbt-image-tooltip-activation rbt-switcher--prd-one" href="#0">
                                                <img class="rbt-h-unset" src="${safeImageUrl}" alt="${alt}">
                                                <div class="rbt-image-tooltip-box">
                                                    <img class="rbt-h-unset" src="${safeImageUrl}" alt="${alt}">
                                                    <span class="img-desc-text">${label}</span>
                                                </div>
                                            </a>`;
                            html += '</li>';
                        }
                    });
                    html += '</ul>';
                    html += '</div>';
                }

                return html;
            }

            // Generate variation markup and return.
            function generateVariationMakup(singleType, typeOfVariation) {
                let html = '';
                const label = escapeHtml(normalizeText(singleType?.label, 'Option'));
                const type = singleType?.type;

                let markup = '';

                switch (type) {
                    case 'color':
                        markup += generateColorVariationMarkup(singleType, typeOfVariation);
                        break;
                    case 'dropdown':
                        markup += generateDropdownVariationMarkup(singleType, typeOfVariation);
                        break;
                    case 'image':
                        markup += generateImageVariationMarkup(singleType, typeOfVariation);
                        break;
                    case 'button':
                        markup += generateButtonVariationMarkup(singleType, typeOfVariation);
                        break;

                }

                // replace markup.

                html += `
                    <div class="rbt-info-wrapper d-flex mt--24">
                        <div class="prd-info-section">
                            <div class="prd-id-text">
                                <p class="text-bold rbt-variation-label">${label}: <span class="rbt-text">No Selection</span></p>
                                ${markup}
                            </div>
                        </div>
                    </div>
                `;

                return html;
            }

            // Check if two object are equal.
            function areObjectsEqual(obj1, obj2) {
                // Check if both are objects
                if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
                    return obj1 === obj2; // Check primitive values
                }

                // Get keys of both objects
                const keys1 = Object.keys(obj1);
                const keys2 = Object.keys(obj2);

                // Check if number of keys is different
                if (keys1.length !== keys2.length) {
                    return false;
                }

                // Check if every key in obj1 is also in obj2 and their values are equal
                for (const key of keys1) {
                    // Check if the key exists in obj2
                    if (!keys2.includes(key)) {
                        return false; // Key No Selection in obj2
                    }
                    // Check if the values are equal (recursively)
                    if (!areObjectsEqual(obj1[key], obj2[key])) {
                        return false; // Values are not equal
                    }
                }

                return true; // All checks passed
            }

            // Generate thumbnails.
            function generateThumbnails(selectedVariationValues, variation = 'variation-1') {
                let thumbHTML = '';
                const thumbnails = selectedVariationValues?.images?.thumbnails;
                if (thumbnails) {
                    Object.keys(thumbnails).forEach((index) => {
                        const thumbnail = thumbnails[index];
                        const alt = escapeHtml(normalizeText(thumbnail?.alt, 'Image'));
                        const url = escapeHtml(sanitizeUrl(thumbnail?.url, 'assets/images/system/placeholder.png'));
                        if ('variation-1' === variation) {
                            thumbHTML += `
                            <div class="swiper-slide rbt-scroll-trigger fade_in animation-order-${index}">
                                <button class="thumbnail d-block position-relative">
                                    <span class="rbt-thumb-img-sm">
                                        <img class="w-100" src="${url}" alt="${alt}">
                                    </span>
                                </button>
                            </div>
                            `;
                        }

                    })
                }

                return thumbHTML;
            }

            // Generate main images.
            function generateMainImages(selectedVariationValues, variation = 'variation-1') {
                let imageHTML = '';
                const images = selectedVariationValues?.images?.full;
                if (images) {
                    Object.keys(images).forEach((index) => {
                        const image = images[index] || 'assets/images/system/placeholder.png';
                        const url = escapeHtml(sanitizeUrl(image?.url, 'assets/images/system/placeholder.png'));
                        const alt = escapeHtml(normalizeText(image?.alt, 'Alt Content'));
                        if ('variation-1' === variation) {
                            imageHTML += `
                            <div class="swiper-slide rbt-scroll-trigger fade_in animation-order-${index}">
                                <div class="thumbnail">
                                    <div class="rbt-product-single-img">
                                        <img class="w-100" data-fancybox="product-single-image" src="${url}" alt="${alt}">
                                    </div>
                                </div>
                            </div>
                            `;
                        }
                    })
                }

                return imageHTML;

            }

            // Generate thumbnails.
            function generateBothImages(selectedVariationValues, variation = 'variation-default') {
                let thumbHTML = '';
                const thumbnails = selectedVariationValues?.images?.thumbnails;
                const fullImages = selectedVariationValues?.images?.full;
                let zeroBaseIndex = 0;
                let stringOne;
                let stringTwo;

                if ('variation-masonary' === variation) {
                    stringOne = 'small-thumbnail';
                    stringTwo = 'large-thumbnail';
                }

                if (thumbnails) {
                    Object.keys(thumbnails).forEach((index) => {
                        // Thumbnail attributes.
                        const thumbnail = thumbnails[index];
                        const thumbnailAlt = escapeHtml(normalizeText(thumbnail?.alt, 'Image'));
                        const thumbnailURL = escapeHtml(sanitizeUrl(thumbnail?.url, 'assets/images/system/placeholder.png'));


                        // Full image attributes.
                        const fullImage = fullImages[index];
                        const fullImageAlt = escapeHtml(normalizeText(fullImage?.alt, 'Image'));
                        const fullImageURL = escapeHtml(sanitizeUrl(fullImage?.url, 'assets/images/system/placeholder.png'));

                        if ('variation-masonary' === variation) {
                            if (0 === zeroBaseIndex) {
                                thumbHTML += `
                                    <div class="col-xl-12 col-sm-6 col-12 rbt-scroll-trigger fade_in animation-order-${index}">
                                        <div class="thumbnail position-relative">
                                            <a class="rbt-product-single-img" data-fancybox="gallery" href="${fullImageURL}">
                                                <img class="w-100 rbt-rounded--12" src="${thumbnailURL}" alt="${thumbnailAlt}">
                                            </a>
                                    </div>
                                </div>
                                `;
                            } else {
                                let output;
                                if (Math.floor((zeroBaseIndex - 1) / 2) % 2 === 0) {
                                    output = (zeroBaseIndex % 2 !== 0) ? stringOne : stringTwo;
                                } else {
                                    output = (zeroBaseIndex % 2 !== 0) ? stringTwo : stringOne;
                                }
                                if (output === 'small-thumbnail') {
                                    thumbHTML += `
                                    <div class="col-xl-4 col-sm-6 col-12 mt--16 rbt-scroll-trigger fade_in animation-order-${index}">
                                        <div class="thumbnail">
                                            <a class="rbt-product-single-img" data-fancybox="gallery" href="${fullImageURL}">
                                                <img class="w-100 rbt-rounded--12" src="${thumbnailURL}" alt="${thumbnailAlt}">
                                            </a>
                                        </div>
                                    </div>
                                    `;
                                } else {
                                    thumbHTML += `
                                    <div class="col-xl-8 col-sm-6 col-12 mt--16 rbt-scroll-trigger fade_in animation-order-${index}">
                                        <div class="thumbnail">
                                            <a class="rbt-product-single-img" data-fancybox="gallery" href="${fullImageURL}">
                                                <img class="w-100 rbt-rounded--12" src="${thumbnailURL}" alt="${thumbnailAlt}">
                                            </a>
                                        </div>
                                    </div>
                                    `;
                                }
                            }

                        }
                        zeroBaseIndex++;
                    })
                }

                return thumbHTML;
            }

            // Generate thumbnails.
            function generateGrid4Images(selectedVariationValues, variation = 'variation-default') {
                let thumbHTML = '';
                const thumbnails = selectedVariationValues?.images?.thumbnails;
                const fullImages = selectedVariationValues?.images?.full;

                if (thumbnails) {
                    Object.keys(thumbnails).forEach((index) => {
                        // Thumbnail attributes.
                        const thumbnail = thumbnails[index];
                        const thumbnailAlt = escapeHtml(normalizeText(thumbnail?.alt, 'Product Images'));
                        const thumbnailURL = escapeHtml(sanitizeUrl(thumbnail?.url, 'assets/images/system/placeholder.png'));

                        // Full image attributes.
                        const fullImage = fullImages[index];
                        const fullImageURL = escapeHtml(sanitizeUrl(fullImage?.url, 'assets/images/system/placeholder.png'));

                        if (variation === 'grid-4') {
                            thumbHTML += `
                            <div class="col-lg-6 col-6 mt--24 rbt-scroll-trigger fade_in animation-order-${index}"">
                                <div class="thumbnail">
                                    <a href="${fullImageURL}" data-fancybox="gallery" class="rbt-product-single-img">
                                        <img class="rbt-rounded--12" src="${thumbnailURL}" data-zoom-image="${fullImageURL}" alt="${thumbnailAlt}">
                                    </a>
                                </div>
                            </div>
                        `;
                        }
                    });
                }

                return thumbHTML;
            }

            // Generate price markup.
            function generatePriceMarkup(selectedVariationValues, variation = 'variation-1') {
                let html = '';

                const price = selectedVariationValues?.price;

                if (undefined === price) {
                    return '';
                }

                const regularPrice = Number(price.regular);
                const salePrice = price.sale === undefined || price.sale === null || price.sale === '' ? null : Number(price.sale);

                if (!isFinite(regularPrice)) {
                    return '';
                }

                if (salePrice !== null && isFinite(salePrice) && salePrice < regularPrice) {
                    const originalPrice = formatPriceValue(salePrice);
                    const formattedRegularPrice = formatPriceValue(regularPrice);
                    const savingsPercentage = Math.round(((regularPrice - salePrice) / regularPrice) * 100); // Calculate savings percentage
                    if ('variation-1' === variation) {
                        html += `
                        <div class="pricing-part mt--0">
                            <del class="price-text">$${formattedRegularPrice}</del>
                            <span class="price-text">$${originalPrice}</span>
                            <span class="rbt-offer-badge rbt-offer-badge-md">Save ${savingsPercentage}%</span>
                        </div>
                        `;
                    }
                } else {
                    if ('variation-1' === variation) {
                        const formattedRegularPrice = formatPriceValue(regularPrice);

                        html += `
                        <div class="pricing-part mt--0">
                            <span class="price-text">$${formattedRegularPrice}</span>
                        </div>
                        `;
                    }
                }

                return html; // Return the generated HTML
            }


            // Generate variation attributes.
            $('.rbt-product-variations').each((_index, element) => {
                let html = '';
                const $this = $(element);
                const variationAtts = getVariationData($this);
                if (!variationAtts || !variationAtts.global || !variationAtts.global.types) return;

                const globalTypes = variationAtts?.global?.types;
                Object.keys(globalTypes).forEach(type => {
                    const singleType = globalTypes[type];

                    html += generateVariationMakup(singleType, type);

                });

                $('.rbt-store-variation-controls').html(html);
            });

            /**
             * ===========================================
             * Variation Functionality.
             * ===========================================
             */

            // change gallery image based on variation.
            const variations = getVariationData($('.rbt-product-variations').first());

            if (!variations || !variations.local || !variations.global || !variations.global.types) {
                return;
            }

            const localAtts = variations.local;
            // watch all available variations.
            const availableVariationTypes = variations.global.types;
            const availableVariationTypeKeys = Object.keys(availableVariationTypes);
            const variationValues = availableVariationTypeKeys.reduce((acc, key) => {
                acc[key] = null;
                return acc;
            }, {});

            const defaultLayoutOneMainImageMarkup = $('.rbt-store-thumb-main-1').html();
            const defaultLayoutOneThumbImageMarkup = $('.rbt-store-thumb-variation-1').html();
            let initialVariationMarkup;
            const variationLayout = $(document).find('.rbt-store-variation-controls').attr('data-variation');

            // Handle default markup.
            if ('variation-masonary' === variationLayout) {
                initialVariationMarkup = $('.rbt-masonary-variation-markup').html();
            }
            if ('variation-grid-4' === variationLayout) {
                initialVariationMarkup = $('.rbt-grid-4-variation-markup').html();
            }
            if ('variation-grid-masonary' === variationLayout) {
                initialVariationMarkup = $('.rbt-grid-masonary-variation-markup').html();
            }


            // switcher support
            $(document).on('click', '.rbt-switcher-root li a', function (e) {
                const $this = $(e.target);

                $(document).trigger('changed_variation', $this);
                const value = $this.closest('[data-value]').attr('data-value');

                const variationName = $this.closest('[data-variation_key]').attr('data-variation_key');
                variationValues[variationName] = value;

                // If any of variation is null, then return.
                for (const key in variationValues) {
                    if (variationValues[key] === null) {
                        return; // Exit the function if any value is null
                    }
                }


                /**
                 * Process the selected variation values.
                 */
                let selectedVariationValues = {};

                Object.keys(localAtts).forEach((key) => {
                    const singleObj = localAtts[key];
                    const attributes = singleObj.attributes;
                    // check if 2 objects are equal.
                    if (areObjectsEqual(attributes, variationValues)) {
                        selectedVariationValues = singleObj;
                        return;
                    }
                })

                // Handle thumbnail and images.
                if (selectedVariationValues) {
                    const thumbnails = generateThumbnails(selectedVariationValues);
                    const mainImage = generateMainImages(selectedVariationValues);
                    const bothImage = generateBothImages(selectedVariationValues, variationLayout);
                    const grid4Images = generateGrid4Images(selectedVariationValues, variationLayout);
                    const gridbothImage = generateGrid4Images(selectedVariationValues, variationLayout);

                    const priceMarkup = generatePriceMarkup(selectedVariationValues);

                    $('.rbt-store-thumb-variation-1').html(thumbnails);
                    if (mainImage.length > 0) {
                        $('.rbt-store-thumb-main-1').html(mainImage);
                    } else {
                        $('.rbt-store-thumb-main-1').html(defaultLayoutOneMainImageMarkup);
                        $('.rbt-store-thumb-variation-1').html(defaultLayoutOneThumbImageMarkup);
                    };

                    $('.rbt-store-price-1').html(priceMarkup);

                    if ('variation-masonary' === variationLayout) {
                        if (bothImage.length > 0) {
                            $('.rbt-masonary-variation-markup').html(bothImage);
                        } else {
                            $('.rbt-masonary-variation-markup').html(initialVariationMarkup);
                        }
                    };
                    if ('grid-4' === variationLayout) {
                        if (grid4Images.length > 0) {
                            $('.rbt-grid-4-variation-markup').html(grid4Images);
                        } else {
                            $('.rbt-grid-4-variation-markup').html(initialVariationMarkup);
                        }

                    };
                    if ('variation-grid-masonary' === variationLayout) {

                        if (gridbothImage.length > 0) {
                            $('.rbt-grid-masonary-variation-markup').html(gridbothImage);
                        } else {
                            $('.rbt-grid-masonary-variation-markup').html(initialVariationMarkup);
                        }


                    };

                    $(document).trigger('gallery_loaded');
                }




            })
            // Enable/disable field based on variation.
            let selectedValues = [];
            $(document).on('click change', '.rbt-switcher-root li a, .rbt-switcher-root select', function (e) {
                $(document).trigger('changed_variation')
                let isFoundVariation = true;
                const $this = $(e.target);

                const rootType = $this.closest('[data-type]').attr('data-type');
                let variationMain = $this.closest('.rbt-product-variations');
                let variation = getVariationData(variationMain);
                const variationKey = $this.closest('[data-variation_key]').attr('data-variation_key');
                let variationValues = '';
                let dataValue;
                const currentItemValue = $this.attr('data-value');
                const rootClass = $this.closest('.rbt-info-wrapper');

                let tooltip;

                if ('click' === e.type) {
                    tooltip = $this.attr('data-tooltip');

                    if (undefined === tooltip) {
                        tooltip = $this.closest('.rbt-switcher--prd').find('.img-desc-text').text();
                    }

                    if ($this.hasClass('rbt-store-radio-button')) {
                        tooltip = $this.text();
                    }

                } else if ('change' === e.type) {
                    // Handle 'select' event here
                    tooltip = $(this).find('option:selected').text();
                }

                rootClass.find('.rbt-variation-label .rbt-text').text(tooltip || 'No Selection');



                const parsedVariation = variation;
                if (!parsedVariation || !parsedVariation.local) {
                    return;
                }
                if ($this.hasClass('rbt-switcher--color')) {
                    Object.keys(parsedVariation.local).forEach((key) => {
                        const parsedVariationObj = parsedVariation.local[key];
                        const parsedAtts = parsedVariationObj.attributes;
                        Object.values(parsedAtts).map((item) => {
                            if (item !== currentItemValue) {
                                isFoundVariation = false;
                            }
                        })
                    });
                }

                if (false === isFoundVariation) {
                    $(document).trigger('disable_all_variations', $this);
                }
                if ('list' === rootType) {
                    dataValue = $this.closest('[data-value]').attr('data-value');
                } else if ('select' === rootType) {
                    dataValue = $this.val();
                }

                if (variation && variation.local) {
                    const localValue = variation.local;
                    const attributes = localValue[0].attributes;
                    variationValues = Object.keys(attributes).reduce((acc, key) => {
                        acc[key] = null;
                        return acc;
                    }, {});

                    // Deep drive to variation and generate matched attributes.
                    Object.keys(localValue).forEach((key) => {
                        const obj = localValue[key];
                        const objAtts = obj.attributes;
                        const clickedObj = objAtts[variationKey];
                        if (clickedObj === dataValue) {
                            Object.keys(objAtts).forEach((key) => {
                                const currentObj = objAtts[key];
                                if (variationValues[key] !== currentObj) {
                                    if (!Array.isArray(variationValues[key])) {
                                        variationValues[key] = [];
                                    }

                                    // Add currentObj to the array if it's not already present
                                    if (!variationValues[key].includes(currentObj)) {
                                        variationValues[key].push(currentObj);
                                    }
                                }
                            })


                        }
                    })
                    variationMain.find('[data-variation_key]').each((index, element) => {
                        const $this = $(element);
                        const variationKeyInner = $this.attr('data-variation_key');

                        const type = $this.attr('data-type');
                        if (type === 'list') {
                            const selector = $this.find('ul');
                            selector.find('li a').each((index, element) => {

                                const currentList = $(element);
                                const value = currentList.attr('data-value');

                                if (variationKeyInner !== variationKey) {
                                    if ((null !== variationValues[variationKeyInner]) && !variationValues[variationKeyInner].includes(value)) {
                                        currentList.addClass('disabled rbt-disabled', true);
                                    } else {
                                        currentList.removeClass('disabled rbt-disabled', true);
                                    }
                                }
                            });
                        } else if (type === 'select') {
                            const selector = $this.find('select');
                            // disabled based on condition.
                            selector.find('option').each((index, element) => {
                                const currentList = $(element);
                                const value = currentList.attr('data-value');
                                if ((variationKeyInner !== variationKey) && (null !== variationValues[variationKeyInner])) {

                                    if (!variationValues[variationKeyInner].includes(value)) {
                                        currentList.attr('disabled', true);
                                    } else {
                                        currentList.removeAttr('disabled', true);
                                    }
                                }
                            })

                            $(document).find('.rbt-select-activation').selectpicker('refresh');
                        }



                    });
                }


            });
            $(document).on('changed_variation', function () {
                $('.rbt-store-reset-variations').html('<button class="rbt-reset-variation rbt-btn rbt-btn-black rbt-btn-xs mt--16 rbt-scroll-trigger fade_in animation-order-1">Reset All</button>');
            });
            $(document).on('click', '.rbt-reset-variation', function (e) {
                const $this = $(e.currentTarget); // Use currentTarget instead of target
                const rootVariation = $this.closest('.rbt-product-variations');

                // Remove 'disabled' and 'rbt-disabled' classes from elements with 'rbt-disabled' class
                rootVariation.find('.rbt-disabled').removeClass('disabled rbt-disabled');
                rootVariation.find('[disabled="disabled"]').removeAttr('disabled');
                $(document).find('.rbt-select-activation').selectpicker('refresh');
                rootVariation.find('.rbt-variation-label .rbt-text').text('No Selection');
                rootVariation.find('.product-switcher-activation li').removeClass('active');
                $this.remove();
            });
            $(document).on('disable_all_variations', function (e, $this) {

                $this = $($this);
                const rootVariation = $this.closest('.rbt-product-variations');
                const currentVariation = $this.closest('[data-variation_key]');
                rootVariation.find('[data-variation_key]').find('ul li a').attr('disabled', true);
                rootVariation.find('[data-variation_key]').find('ul li a').addClass('disabled');
                rootVariation.find('select').find('option').each((index, element) => {
                    const currentList = $(element);
                    currentList.attr('disabled', true);
                })
                currentVariation.find('ul li a').attr('disabled', false);
                currentVariation.find('ul li a').removeClass('disabled');

                $(document).find('.rbt-select-activation').selectpicker('refresh');

            })

            $(document).on('change', '.rbt-switcher-root select', function (e) {
                // variationValues.rbt_product_attribute_style = 'casual';
                const $this = $(e.target);
                const value = $this.val();
                const variationName = $this.closest('[data-variation_key]').attr('data-variation_key');

                variationValues[variationName] = value;

            })

        }

    }
    $(window).ready(() => {
        rbtJs.i();
    })


})(window, document, jQuery);





/* Original template: main.js */
(function (window, document, $, undefined) {
    'use strict';
    var rbtJs = {
        i: function (e) {
            rbtJs.d();
            rbtJs.methods();
        },

        d: function (e) {
            this._window = $(window),
                this._document = $(document),
                this._body = $('body'),
                this._html = $('html')
        },
        methods: function (e) {
            rbtJs.preloaderInit();
            rbtJs.offCanvas();
            rbtJs.filterOffCanvas();
            rbtJs.cartSidenav();
            rbtJs.categoryOffcanvas();
            rbtJs.cartQtyinfo();
            rbtJs.menuCurrentLink();
            rbtJs.rbtSwiperActive();
            rbtJs.counterUp();
            rbtJs.stickyHeader();
            rbtJs.marqueImage();
            rbtJs.popupMobileMenu();
            rbtJs.headerSticky();
            rbtJs.transparentHeader();
            rbtJs.categoryMenuHover();
            rbtJs.selectPickerActivation();
            rbtJs.headerTopActivation();
            rbtJs.showMoreBtn();
            rbtJs.colorSwitcherActivation();
            rbtJs.productSwitcherActivation();
            rbtJs.productOnclickSlider();
            rbtJs.productHoverSlider();
            rbtJs.tooltipsActivation();
            rbtJs.responsivelookbookView();
            rbtJs.clickDoc();
            rbtJs.headermenuHover();
            rbtJs.videoStyleHover();
            rbtJs.rbtPriceRangeBar();
            rbtJs.rbtMagneticBtn();
            rbtJs.rbtDragdropArea();
            rbtJs.videoPoput();
            rbtJs.onePageNav();
            rbtJs.stickyBrandList();
            rbtJs.copyLink();
            rbtJs.openOffcanvasPopup();
            rbtJs.openTabItems();
            rbtJs.calculateSidebarHeight();
            rbtJs.elevatezoomActivation();
            rbtJs.miniCartBottom();
            rbtJs.searchMediaPopup();
            rbtJs.RbtEsAnimation();
            rbtJs.RbtTiktokSection();
            rbtJs.openComparison();
            rbtJs.openQuickviewsidenav();
            rbtJs.showProductOptions();
            rbtJs.RbtnavEffectActivation();
            $(document).on('tabActiveHighlight', function () {
                rbtJs.RbtnavEffectActivation();
            })
            rbtJs.RbtcartCountdown();
            rbtJs.RbtbottomTools();
            rbtJs.RbthoverTab();
            rbtJs.RbtcollapseText();
            rbtJs.RbtImgSelect();
            rbtJs.RbtsearchPlaceholderSlider();
            rbtJs.pricingPlan();
            $(document).on('renderIsotopeAgainAfterLoad', function () {
                rbtJs.isotopeActivation();
            });
            rbtJs.isotopeActivation();
            rbtJs.progressCount();
            rbtJs.openSocialShare();
            rbtJs.remainingPopup();
            rbtJs.cookieAlert();
            rbtJs.moveAnimation();
            rbtJs.dropdownActivation();
            rbtJs.welcomeBanner();
            rbtJs.colorAnimation();
            rbtJs.defaultFormValidation();
            rbtJs.popoverActivation();
            rbtJs.toastActive();
            rbtJs.loadMoreDemos();
            rbtJs.datepickerActivation();
            rbtJs.tabActivationWithNavigation();
            rbtJs.sidenavActivation();
            rbtJs.rbtInputPattern();
            rbtJs.handleSearchFilterOptions();
            rbtJs.contactForm();
            rbtJs.scrollDownActivation();
            rbtJs.copyrightYear();
        },
        preloaderInit: function () {
            $(document).ready(function () {
                $('.rbt-preloader').fadeOut('slow', function () {
                    $(this).hide();
                });
            });
        },

        offCanvas: function () {
            if ($('.rbt-offcanvas-activation').length) {
                $('.rbt-offcanvas-activation').on('click', function () {
                    $('.side-menu').addClass('side-menu-active'),
                        $('body').addClass('offcanvas-menu-active')
                }),

                    $('.close_side_menu').on('click', function () {
                        $('.side-menu').removeClass('side-menu-active'),
                            $('body').removeClass('offcanvas-menu-active')
                    }),

                    $('.side-menu .side-nav .navbar-nav li a').on('click', function () {
                        $('.side-menu').removeClass('side-menu-active'),
                            $('body').removeClass('offcanvas-menu-active')
                    }),

                    $('#btn_sideNavClose, #btn_sideNavCloseOrder').on('click', function () {
                        $('.side-menu').removeClass('side-menu-active'),
                            $('body').removeClass('offcanvas-menu-active')
                    });
            }
        },

        filterOffCanvas: function () {
            var handleFilterAccordions = function () {
                var shouldCollapse = window.matchMedia('(max-width: 991.98px)').matches;
                $('.rbt-filter-offcanvas-area').each(function () {
                    $(this).find('.collapse').toggleClass('show', !shouldCollapse);

                    $(this).find('[data-bs-toggle="collapse"]').each(function () {
                        var $trigger = $(this);
                        var targetSelector = $trigger.attr('href');

                        if (!targetSelector) return;

                        var $target = $(targetSelector);
                        var isExpanded = $target.hasClass('show');

                        // Keep Bootstrap trigger state in sync with forced responsive collapse state.
                        $trigger.attr('aria-expanded', isExpanded);
                        $trigger.toggleClass('collapsed', !isExpanded);
                    });
                });
            };

            handleFilterAccordions();
            $(window).on('resize', handleFilterAccordions);

            if ($('.rbt-filter-offcanvas-activation').length) {
                $('.rbt-filter-offcanvas-activation').on('click', function (e) {
                    e.preventDefault();
                    $('.side-menu').addClass('side-menu-active'),
                        $('body').addClass('offcanvas-menu-active')
                }),

                    $('.close_side_menu').on('click', function () {
                        $('.side-menu').removeClass('side-menu-active'),
                            $('body').removeClass('offcanvas-menu-active')
                    }),

                    $('.side-menu .side-nav .navbar-nav li a').on('click', function () {
                        $('.side-menu').removeClass('side-menu-active'),
                            $('body').removeClass('offcanvas-menu-active')
                    }),

                    $('.rbt-sidebar-close-btn').on('click', function () {
                        $('.side-menu').removeClass('side-menu-active'),
                            $('body').removeClass('offcanvas-menu-active')
                    });
            }
        },

        cartSidenav: function () {
            $('body').on('click', '.rbt-cart-sidenav-activation', function (e) {
                e.preventDefault();
                $('.rbt-cart-side-menu').addClass('side-menu-active');
                $('body').addClass('cart-sidenav-menu-active');
            });
            $('body').on('click', '.rbt-order-sidenav-activation', function (e) {
                e.preventDefault();
                $('.rbt-order-sidenav').addClass('side-menu-active');
                $('body').addClass('cart-sidenav-menu-active');
            });

            $('body').on('click', '.rbt-ordered-products-sidenav-activation', function (e) {
                e.preventDefault();
                $('.rbt-ordered-products-sidenav').addClass('side-menu-active');
                $('body').addClass('cart-sidenav-menu-active');
            });

            $('body').on('click', '.rbt-review-sidenav-activation', function (e) {
                e.preventDefault();
                $('.rbt-review-sidenav').addClass('side-menu-active');
                $('body').addClass('cart-sidenav-menu-active');
            });

            $('body').on('click', '.minicart-close-button', function () {
                $('.rbt-cart-side-menu').removeClass('side-menu-active');
                $('body').removeClass('cart-sidenav-menu-active');
            }),

                $('body').on('click', '.side-menu .side-nav .navbar-nav li a', function () {
                    $('.rbt-cart-side-menu').removeClass('side-menu-active');
                    $('body').removeClass('cart-sidenav-menu-active');
                }),
                $('body').on('click', '.close_side_menu, #btn_sideNavClose, #btn_sideNavCloseOrder', function () {
                    $('.rbt-cart-side-menu, .rbt-order-sidenav, .rbt-ordered-products-sidenav, .rbt-review-sidenav').removeClass('side-menu-active');
                    $('body').removeClass('cart-sidenav-menu-active');
                })
        },

        categoryOffcanvas: function () {

            if ($('.rbt-cat-offcanvas-activation').length) {
                $('.rbt-cat-offcanvas-activation').on('click', function () {
                    $('.rbt-offcanvas-cat-side-menu').addClass('side-menu-active'),
                        $('body').addClass('cart-sidenav-menu-active')
                }),



                    $('.rbt-sidebar-close-btn').on('click', function () {
                        setTimeout(function () {
                            $('.rbt-offcanvas-cat-side-menu').removeClass('side-menu-active');
                            $('body').removeClass('cart-sidenav-menu-active');
                        }, 300);
                    });

                $('#btn_sideNavClose, #btn_sideNavCloseOrder, .close_side_menu').on('click', function () {
                    setTimeout(function () {
                        $('.rbt-offcanvas-cat-side-menu').removeClass('side-menu-active');
                        $('body').removeClass('cart-sidenav-menu-active');
                    }, 300);
                });
            };


            if ($('.rbt-special-offprds-offcanvas-activation').length) {
                $('.rbt-special-offprds-offcanvas-activation').on('click', function () {
                    $('.rbt-special-offprds-side-menu').addClass('side-menu-active'),
                        $('body').addClass('cart-sidenav-menu-active')
                }),

                    $('.rbt-sidebar-close-btn').on('click', function () {
                        setTimeout(function () {
                            $('.rbt-special-offprds-side-menu').removeClass('side-menu-active');
                            $('body').removeClass('cart-sidenav-menu-active');
                        });
                    });

                $('#btn_sideNavClose, #btn_sideNavCloseOrder, .close_side_menu').on('click', function () {
                    setTimeout(function () {
                        $('.rbt-special-offprds-side-menu').removeClass('side-menu-active');
                        $('body').removeClass('cart-sidenav-menu-active');
                    });
                });
            }
        },

        cartQtyinfo: function () {
            $('.qty-item-btn').on('click', function () {
                var $button = $(this);
                var $parent = $button.closest('.rbt-qty-area');
                var $input = $parent.find('.items-qty-input');
                var oldValue = parseFloat($input.val());

                if ($button.hasClass('qty-item-btn-incr')) {
                    var newVal = oldValue + 1;
                } else if ($button.hasClass('qty-item-btn-decr')) {
                    if (oldValue > 1) {
                        newVal = oldValue - 1;
                    } else {
                        newVal = 1;
                    }
                }

                var newValPadded = newVal.toString().padStart(2, '0');
                $input.val(newValPadded);
                $input.trigger('change');
            });
        },

        menuCurrentLink: function () {
            var currentPage = location.pathname.split('/'),
                current = currentPage[currentPage.length - 1];
            $('.mainmenu li a, .dashboard-mainmenu li a, .for-right-content .rbt-course-main-content li a, .rbt-shop-view-menu a').each(function () {
                var $this = $(this);
                if ($this.attr('href') === current) {
                    $this.removeClass('active');
                    $this.addClass('active');
                    $this.parents('.has-menu-child-item').removeClass('menu-item-open');
                    $this.parents('.has-menu-child-item').addClass('menu-item-open');
                }
            });
        },

        rbtSwiperActive: function () {
            var BaseSwiper = window.Swiper;

            if (typeof BaseSwiper !== 'function') {
                return;
            }

            function revealSwiper(swiperInstance) {
                if (!swiperInstance || !swiperInstance.el) {
                    return;
                }

                $(swiperInstance.el).css('visibility', 'visible');
                $(swiperInstance.el).closest('.rbt-arrow-between').addClass('is-swiper-ready');
            }

            function queueSwiperRefresh(swiperInstance) {
                var deferRefresh = requestAnimationFrame || function (callback) {
                    setTimeout(callback, 0);
                };

                deferRefresh(function () {
                    swiperInstance.update();
                    revealSwiper(swiperInstance);
                });

                if (document.readyState !== 'complete') {
                    $(window).one('load', function () {
                        swiperInstance.update();
                        revealSwiper(swiperInstance);
                    });
                }
            }

            function createSwiper(target, config) {
                if (target && target.swiper && !target.swiper.destroyed) {
                    queueSwiperRefresh(target.swiper);
                    return target.swiper;
                }

                var swiperConfig = $.extend(true, {}, config);
                var originalOn = swiperConfig.on || {};

                swiperConfig.init = false;
                swiperConfig.on = $.extend({}, originalOn, {
                    init: function () {
                        if (typeof originalOn.init === 'function') {
                            originalOn.init.apply(this, arguments);
                        }

                        revealSwiper(this);
                    },
                    imagesReady: function () {
                        if (typeof originalOn.imagesReady === 'function') {
                            originalOn.imagesReady.apply(this, arguments);
                        }

                        this.update();
                        revealSwiper(this);
                    }
                });

                var swiperInstance = new BaseSwiper(target, swiperConfig);
                swiperInstance.init();
                queueSwiperRefresh(swiperInstance);

                return swiperInstance;
            }

            var Swiper = function (target, config) {
                return createSwiper(target, config);
            };

            function initializeSwipers() {
                $('.inc-item-swiper-activation').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            grabCursor: true,
                            spaceBetween: 16,
                            pagination: {
                                el: '.rbt-swiper-pagination',
                                clickable: true
                            },
                        });
                    }
                });


                $('.category-activation-one').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1.3,
                            spaceBetween: 0,
                            loop: true,
                            navigation: false,
                            breakpoints: {
                                481: { slidesPerView: 2.3 },
                                768: { slidesPerView: 3.3 },
                                992: { slidesPerView: 4.3 },
                                1400: { slidesPerView: 5.3 },
                                1600: { slidesPerView: 6.3 }
                            },
                        });
                    }
                });

                $('.rbt-sm-review-card-swiper-activation-1').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 2.7,
                            spaceBetween: 16,
                            loop: true,
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                            },
                            breakpoints: {
                                481: { slidesPerView: 1 },
                                768: { slidesPerView: 2 },
                                992: { slidesPerView: 2.7 },
                                1400: { slidesPerView: 2.7 },
                                1600: { slidesPerView: 2.7 }
                            },
                        });
                    }
                });

                $('.product-swiper-activation-one').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1.2,
                            spaceBetween: 24,
                            loop: true,
                            navigation: false,
                            speed: 1000,
                            scrollbar: {
                                el: '.swiper-scrollbar',
                                draggable: true,
                            },
                            breakpoints: {
                                481: { slidesPerView: 2 },
                                768: { slidesPerView: 2 },
                                992: { slidesPerView: 2 },
                                1200: { slidesPerView: 4 }
                            },
                        });
                    }
                });

                $('.product-swiper-activation-two').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 6,
                            spaceBetween: 0,
                            loop: true,
                            navigation: false,
                            breakpoints: {
                                481: { slidesPerView: 2 },
                                768: { slidesPerView: 2 },
                                992: { slidesPerView: 3 },
                                1200: { slidesPerView: 4 }
                            },
                        });
                    }
                });

                $('.product-swiper-activation-three').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 0,
                            loop: true,
                            navigation: false,
                            breakpoints: {
                                481: { slidesPerView: 2 },
                                768: { slidesPerView: 2 },
                                992: { slidesPerView: 3 },
                                1200: { slidesPerView: 4 }
                            },
                        });
                    }
                });

                $('.prd-single-slide-activation-1').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            grabCursor: true,
                            speed: 500,
                            spaceBetween: 24,
                            loop: true,
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: { slidesPerView: 2 },
                                768: { slidesPerView: 2 },
                                992: { slidesPerView: 2 },
                                1200: { slidesPerView: 2 }
                            },
                        });
                    }
                });

                $('.rbt-product-thumb-slider-twolayout-activation').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            spaceBetween: 16,
                            slidesPerView: 4,
                            freeMode: true,
                            watchSlidesProgress: true,
                            breakpoints: {
                                0: {
                                    direction: 'horizontal',
                                    slidesPerView: 4,
                                },
                                992: {
                                    direction: 'horizontal',
                                    slidesPerView: 4,
                                },
                            },
                        });
                    }
                });


                $('.rbt-product-single-slider-twolayout-activation').each(function (index) {
                    var $thisSlider = $(this);
                    var $thumbSlider = $('.rbt-product-thumb-slider-twolayout-activation').eq(index);

                    if ($thisSlider.length > 0 && $thumbSlider.length > 0) {
                        var swiperThumb = new Swiper($thumbSlider[0], {
                            spaceBetween: 16,
                            slidesPerView: 4,
                            freeMode: true,
                            watchSlidesProgress: true,
                            breakpoints: {
                                0: {
                                    direction: 'horizontal',
                                    slidesPerView: 4,
                                },
                                992: {
                                    direction: 'horizontal',
                                    slidesPerView: 4,
                                },
                            },
                        });

                        new Swiper($thisSlider[0], {
                            spaceBetween: 16,
                            breakpoints: {
                                575: { slidesPerView: 1 },
                                768: { slidesPerView: 2 },
                                992: { slidesPerView: 2 },
                                1200: { slidesPerView: 2 }
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                            },
                            thumbs: {
                                swiper: swiperThumb,
                            },
                        });
                    }
                });


                $('.product-swiper-activation-three-lookbook').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1.8,
                            spaceBetween: 24,
                            loop: true,
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            pagination: {
                                el: '.rbt-swiper-pagination, .abc',
                                clickable: true,
                            },
                            navigation: {
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                481: { slidesPerView: 2 },
                                768: { slidesPerView: 2 },
                                992: { slidesPerView: 2 },
                                1200: { slidesPerView: 2 }
                            },
                            on: {
                                init: function () {
                                    const thisVal = this;
                                    $('.show-rbt-lookbook-dot').on('click', function (e) {
                                        e.preventDefault();
                                        const activeItemIndex = $(this).data('index');
                                        thisVal.slideTo(activeItemIndex);
                                    });
                                },
                            },
                        });
                    }
                });

                $('.rbt-hero-banner-activation-1').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            loop: true,
                            pagination: {
                                el: '.rbt-swiper-pagination, .abc',
                                clickable: true,
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                    navigation: false,
                                },
                                768: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                    navigation: {
                                        prevEl: '.rbt-arrow-left',
                                        nextEl: '.rbt-arrow-right',
                                        clickable: true,
                                    },
                                },
                                992: {
                                    slidesPerView: 2,
                                    slidesPerGroup: 2,
                                },
                                1200: {
                                    slidesPerView: 2,
                                    slidesPerGroup: 2,
                                },
                            },
                        });
                    }
                });

                $('.rbt-hero-banner-activation-2').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            spaceBetween: 24,
                            loop: true,
                            autoplay: false,
                            pagination: {
                                el: '.rbt-swiper-container-one.rbt-dot-right-center .rbt-swiper-pagination, .abc',
                                clickable: true,
                            },
                            navigation: false,
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                                768: {
                                    slidesPerView: 1.6,
                                    slidesPerGroup: 1,
                                },
                                992: {
                                    slidesPerView: 2,
                                    slidesPerGroup: 1,
                                },
                                1200: {
                                    slidesPerView: 3,
                                    slidesPerGroup: 1,
                                },
                            },
                        });
                    }
                });

                $('.rbt-hero-banner-activation-2-version-center').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            spaceBetween: 24,
                            loop: true,
                            autoplay: false,
                            centeredSlides: true,
                            pagination: {
                                el: '.rbt-swiper-container-one.rbt-dot-bottom-center .rbt-swiper-pagination, .abc',
                                clickable: true,
                            },
                            navigation: false,
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                                768: {
                                    slidesPerView: 1.6,
                                    slidesPerGroup: 1,
                                },
                                992: {
                                    slidesPerView: 2,
                                    slidesPerGroup: 1,
                                },
                                1200: {
                                    slidesPerView: 2.5,
                                    slidesPerGroup: 1,
                                },
                            },
                        });
                    }
                });

                $('.rbt-fashion-prd-card-activation-1').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            loop: true,
                            pagination: {
                                el: '.rbt-swiper-pagination, .abc',
                                clickable: true,
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                                992: {
                                    slidesPerView: 2,
                                    slidesPerGroup: 1,
                                },
                            },
                        });
                    }
                });
                $('.rbt-fashion-prd-card-activation-1-v1').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1.8,
                            spaceBetween: 24,
                            loop: true,
                            pagination: {
                                el: '.rbt-swiper-pagination, .abc',
                                clickable: true,
                                dynamicBullets: true,
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1.8,
                                    slidesPerGroup: 1,
                                },
                                768: {
                                    slidesPerView: 2.8,
                                    slidesPerGroup: 1,
                                },
                                992: {
                                    slidesPerView: 2.8,
                                    slidesPerGroup: 1,
                                },
                                1200: {
                                    slidesPerView: 4,
                                    slidesPerGroup: 1,
                                },
                            },
                        });
                    }
                });

                $('.rbt-fashion-prd-card-activation-1-v3').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1.8,
                            spaceBetween: 24,
                            loop: true,
                            breakpoints: {
                                575: {
                                    slidesPerView: 1.8,
                                    slidesPerGroup: 1,
                                    centeredSlides: false,
                                },
                                768: {
                                    slidesPerView: 2.8,
                                    slidesPerGroup: 1,
                                    centeredSlides: false,
                                },
                                992: {
                                    slidesPerView: 2.8,
                                    slidesPerGroup: 1,
                                    centeredSlides: true,
                                },
                                1200: {
                                    slidesPerView: 4.5,
                                    slidesPerGroup: 1,
                                },
                            },
                        });
                    }
                });
                $('.rbt-review-card-activation-1').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            loop: true,
                            pagination: {
                                el: '.rbt-swiper-pagination, .abc',
                                clickable: true,
                                dynamicBullets: true,
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                                768: {
                                    slidesPerView: 1.8,
                                    slidesPerGroup: 1,
                                },
                                992: {
                                    slidesPerView: 2.3,
                                    slidesPerGroup: 1,
                                },
                                1200: {
                                    slidesPerView: 3,
                                    slidesPerGroup: 1,
                                },
                            },
                        });
                    }
                });
                $('.rbt-fashion-prd-card-activation-1-v2').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1.8,
                            spaceBetween: 24,
                            loop: true,
                            pagination: {
                                el: '.rbt-swiper-pagination, .abc',
                                clickable: true,
                                dynamicBullets: true,
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1.8,
                                    slidesPerGroup: 1,
                                },
                                768: {
                                    slidesPerView: 2.8,
                                    slidesPerGroup: 1,
                                },
                                992: {
                                    slidesPerView: 2.8,
                                    slidesPerGroup: 1,
                                },
                                1200: {
                                    slidesPerView: 3,
                                    slidesPerGroup: 1,
                                },
                            },
                        });
                    }
                });

                $('.team-slide-activation').each(function (index) {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            loop: true,
                            pagination: {
                                el: '.rbt-swiper-pagination, .abc',
                                clickable: true,
                                dynamicBullets: true,
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                                768: {
                                    slidesPerView: 2,
                                    slidesPerGroup: 1,
                                },
                                992: {
                                    slidesPerView: 3,
                                    slidesPerGroup: 2,
                                },
                                1200: {
                                    slidesPerView: 4,
                                    slidesPerGroup: 1,
                                },
                                1600: {
                                    slidesPerView: 6,
                                    slidesPerGroup: 1,
                                },
                            },
                        });
                    }
                });

                $('.rbt-fashion-prd-card-activation-2').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1.8,
                            spaceBetween: 24,
                            loop: true,
                            pagination: false,
                            navigation: {
                                prevEl: '.rbt-fashion-prd-card-activation-2-container .rbt-arrow-left',
                                nextEl: '.rbt-fashion-prd-card-activation-2-container .rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1.8,
                                    slidesPerGroup: 1,
                                },
                                768: {
                                    slidesPerView: 2.8,
                                    slidesPerGroup: 1,
                                },
                                992: {
                                    slidesPerView: 2.8,
                                    slidesPerGroup: 1,
                                },
                                1200: {
                                    slidesPerView: 4,
                                    slidesPerGroup: 1,
                                },
                            },
                        });
                    }
                });

                $('.product-swiper-activation-one-var-one').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1.2,
                            spaceBetween: 16,
                            loop: true,
                            navigation: false,
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            breakpoints: {
                                481: {
                                    slidesPerView: 1.2,
                                },
                                768: {
                                    slidesPerView: 1.1,
                                },
                                992: {
                                    slidesPerView: 2.1,
                                },
                                1600: {
                                    slidesPerView: 3,
                                }
                            },
                            scrollbar: {
                                el: '.swiper-scrollbar',
                                draggable: true,
                            },
                        });
                    }
                });

                $('.rbt-hero-banner-activation-3').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            grabCursor: true,
                            loop: true,
                            speed: 500,
                            draggable: true,
                            effect: 'fade',
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            pagination: {
                                el: '.rbt-swiper-pagination, .abc',
                                clickable: true,
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                                768: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                                992: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                                1200: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                            },
                        });
                    }
                });

                $('.rbt-blog-wrapper-slide-acivation').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            slidesPerGroup: 1,
                            loop: true,
                            draggable: true,
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                        });
                    }
                });

                $('.rbt-jwellery-hero-activation-1').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            parallax: true,
                            effect: 'fade',
                            loop: true,
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                },
                                768: {
                                    slidesPerView: 1,
                                },
                                992: {
                                    slidesPerView: 1,
                                },
                                1200: {
                                    slidesPerView: 1,
                                },
                            },
                        });
                    }
                });

                $('.rbt-jw-prd-activation-1').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            slidesPerGroup: 1,
                            spaceBetween: 24,
                            loop: true,
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            scrollbar: {
                                el: '.swiper-scrollbar',
                                draggable: true,
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 2,
                                },
                                992: {
                                    slidesPerView: 3,
                                },
                                1200: {
                                    slidesPerView: 4,
                                },
                            },
                        });
                    }
                });

                $('.rbt-sports-prd-activation-1').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            slidesPerGroup: 1,
                            spaceBetween: 24,
                            loop: true,
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                },
                                768: {
                                    slidesPerView: 2,
                                },
                                992: {
                                    slidesPerView: 3,
                                },
                                1200: {
                                    slidesPerView: 2,
                                },
                            },
                            scrollbar: {
                                el: '.swiper-scrollbar',
                                draggable: 'true',
                            },
                        });
                    }
                });


                $('.rbt-cs-hero-banner-activation').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            slidesPerGroup: 1,
                            spaceBetween: 24,
                            loop: true,
                            effect: 'fade',
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            pagination: {
                                el: '.rbt-swiper-pagination, .abc',
                                clickable: true,
                            },

                        });
                    }
                });

                $('.rbt-beauty-prd-activation-1').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            slidesPerGroup: 1,
                            spaceBetween: 24,
                            loop: true,
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            pagination: {
                                el: '.rbt-swiper-progress',
                                type: 'progressbar'
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                },
                                768: {
                                    slidesPerView: 2,
                                },
                                992: {
                                    slidesPerView: 3,
                                },
                                1200: {
                                    slidesPerView: 4,
                                },
                            },
                        });
                    }
                });

                $('.rbt-sports-hero-activation-1').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            parallax: true,
                            loop: true,
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                },
                                768: {
                                    slidesPerView: 1,
                                },
                                992: {
                                    slidesPerView: 1,
                                },
                                1200: {
                                    slidesPerView: 1,
                                },
                            },
                        });
                    }
                });

                $('.rbt-glass-hero-banner-activation-1').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            loop: true,
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            pagination: {
                                el: '.rbt-swiper-pagination, .abc',
                                clickable: true,
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                                768: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                                992: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                                1200: {
                                    slidesPerView: 1,
                                    slidesPerGroup: 1,
                                },
                            },
                        });
                    }
                });

                $('.rbt-phone-prd-activation-1').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1.3,
                            slidesPerGroup: 1,
                            spaceBetween: 24,
                            loop: true,
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            pagination: {
                                el: '.rbt-swiper-progress',
                                type: 'progressbar'
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1.3,
                                },
                                768: {
                                    slidesPerView: 2.3,
                                },
                                992: {
                                    slidesPerView: 2.6,
                                },
                                1200: {
                                    slidesPerView: 4,
                                },
                            },
                        });
                    }
                });

                $('.rbt-access-prd-activation-1').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            slidesPerGroup: 1,
                            spaceBetween: 24,
                            loop: true,
                            autoplay: {
                                delay: 5000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true
                            },
                            pagination: {
                                el: '.rbt-swiper-progress',
                                type: 'progressbar'
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                575: {
                                    slidesPerView: 1,
                                },
                                768: {
                                    slidesPerView: 2,
                                },
                                992: {
                                    slidesPerView: 3,
                                },
                                1200: {
                                    slidesPerView: 4,
                                },
                            },
                        });
                    }
                });

                $(document).on('gallery_loaded', function () {
                    $('.product-single-slider-two-thumb-activation').each(function () {
                        var $thisSlider = $(this);
                        if ($thisSlider.length > 0) {
                            new Swiper($thisSlider[0], {
                                direction: 'vertical',
                                slidesPerView: 3,
                                spaceBetween: 12,
                                breakpoints: {
                                    0: {
                                        direction: 'horizontal',
                                        slidesPerView: 4,
                                    },
                                    992: {
                                        direction: 'vertical',
                                        slidesPerView: 4,
                                    },
                                },
                            });
                        }
                    });

                    $('.product-single-slider-two-activation').each(function () {
                        var $thisSlider = $(this);
                        if ($thisSlider.length > 0) {
                            var swiper24 = new Swiper('.product-single-slider-two-thumb-activation', {
                                direction: 'vertical',
                                slidesPerView: 3,
                                spaceBetween: 12,
                                loop: true,
                                breakpoints: {
                                    0: {
                                        direction: 'horizontal',
                                        slidesPerView: 3,
                                    },
                                    992: {
                                        direction: 'vertical',
                                        slidesPerView: 4,
                                    },
                                },
                                navigation: {
                                    prevEl: '.rbt-arrow-left',
                                    nextEl: '.rbt-arrow-right',
                                },
                            });

                            new Swiper($thisSlider[0], {
                                spaceBetween: 24,
                                navigation: {
                                    prevEl: '.rbt-arrow-left',
                                    nextEl: '.rbt-arrow-right',
                                },
                                thumbs: {
                                    swiper: swiper24,
                                },
                            });
                        }
                    });

                    // Initialize the thumbnail swiper
                    var thumbSwiper = null;
                    var mainSwiper = null;

                    $('.product-single-slider-three-thumb-activation').each(function () {
                        var $thisSlider = $(this);
                        if ($thisSlider.length > 0) {
                            thumbSwiper = new Swiper($thisSlider[0], {
                                direction: 'vertical',
                                slidesPerView: 4,
                                spaceBetween: 12,
                                loop: true,
                                breakpoints: {
                                    0: {
                                        direction: 'horizontal',
                                        slidesPerView: 3,
                                    },
                                    768: {
                                        direction: 'horizontal',
                                        slidesPerView: 4,
                                    },
                                    992: {
                                        direction: 'vertical',
                                        slidesPerView: 4,
                                    },
                                },
                            });
                        }
                    });

                    // Initialize the main swiper
                    $('.product-single-slider-three-activation').each(function () {
                        var $thisSlider = $(this);
                        if ($thisSlider.length > 0) {
                            mainSwiper = new Swiper($thisSlider[0], {
                                spaceBetween: 24,
                                slidesPerView: 4,
                                direction: 'vertical',
                                loop: true,
                                navigation: {
                                    prevEl: '.rbt-arrow-left',
                                    nextEl: '.rbt-arrow-right',
                                },
                                thumbs: {
                                    swiper: thumbSwiper,
                                },
                                breakpoints: {
                                    320: {
                                        slidesPerView: 1,
                                        direction: 'horizontal',
                                    },
                                    992: {
                                        direction: 'vertical',
                                        slidesPerView: 4,
                                    }
                                }
                            });

                            mainSwiper.on('slideChange', function () {
                                thumbSwiper.slideTo(mainSwiper.activeIndex);
                            });

                            $('.product-single-slider-three-thumb-activation .swiper-slide').on('click', function () {
                                var index = $(this).index();
                                mainSwiper.slideTo(index);
                                thumbSwiper.slideTo(index);
                            });
                        }
                    });
                    $('.rbt-product-thumb-slider-threelayout-activation').each(function (index) {
                        var $thisSlider = $(this);
                        if ($thisSlider.length > 0) {
                            new Swiper($thisSlider[0], {
                                spaceBetween: 16,
                                slidesPerView: 4,
                                freeMode: true,
                                watchSlidesProgress: true,
                                loop: true,
                                breakpoints: {
                                    0: {
                                        direction: 'horizontal',
                                        slidesPerView: 4,
                                    },
                                    992: {
                                        direction: 'horizontal',
                                        slidesPerView: 4,
                                    },
                                },
                            });
                        }
                    });


                    $('.rbt-product-single-slider-threelayout-activation').each(function (index) {
                        var $thisSlider = $(this);
                        var $thumbSlider = $('.rbt-product-thumb-slider-threelayout-activation').eq(index);

                        if ($thisSlider.length > 0 && $thumbSlider.length > 0) {
                            var swiperThumb = new Swiper($thumbSlider[0], {
                                spaceBetween: 16,
                                slidesPerView: 4,
                                freeMode: true,
                                loop: true,
                                watchSlidesProgress: true,
                                breakpoints: {
                                    0: {
                                        direction: 'horizontal',
                                        slidesPerView: 4,
                                    },
                                    992: {
                                        direction: 'horizontal',
                                        slidesPerView: 8,
                                        loop: true,
                                    },
                                },
                            });

                            new Swiper($thisSlider[0], {
                                spaceBetween: 24,
                                breakpoints: {
                                    575: { slidesPerView: 1 },
                                    768: { slidesPerView: 2 },
                                    1200: { slidesPerView: 3 }
                                },
                                navigation: {
                                    prevEl: '.rbt-arrow-left',
                                    nextEl: '.rbt-arrow-right',
                                },
                                thumbs: {
                                    swiper: swiperThumb,
                                },
                            });
                        }
                    });

                    $('.rbt-product-single-slider-threelayout-activation-v2').each(function (index) {
                        var $thisSlider = $(this);
                        if ($thisSlider.length > 0) {
                            new Swiper($thisSlider[0], {
                                spaceBetween: 24,
                                slidesPerView: 1,
                                centeredSlides: true,
                                loop: true,
                                breakpoints: {
                                    575: { slidesPerView: 1 },
                                    768: { slidesPerView: 1.5 },
                                    992: { slidesPerView: 2 },
                                    1200: { slidesPerView: 2.5 }
                                },

                                navigation: {
                                    prevEl: '.rbt-arrow-left',
                                    nextEl: '.rbt-arrow-right',
                                }
                            });
                        }
                    });

                    $('.rbt-product-single-slider-fourlayout-activation').each(function (index) {
                        var $thisSlider = $(this);
                        if ($thisSlider.length > 0) {
                            new Swiper($thisSlider[0], {
                                spaceBetween: 24,
                                slidesPerView: 1,
                                loop: true,
                                breakpoints: {
                                    575: { slidesPerView: 1 },
                                    768: { slidesPerView: 2 },
                                    992: { slidesPerView: 3 },
                                    1200: { slidesPerView: 4 }
                                },

                                navigation: {
                                    prevEl: '.rbt-arrow-left',
                                    nextEl: '.rbt-arrow-right',
                                }
                            });
                        }
                    });
                    $('.rbt-qs-wrapper-slide-acivation').each(function () {
                        var $thisSlider = $(this);
                        if ($thisSlider.length > 0) {
                            new Swiper($thisSlider[0], {
                                slidesPerView: 1,
                                spaceBetween: 24,
                                slidesPerGroup: 1,
                                loop: true,
                                speed: 1000,
                                navigation: {
                                    prevEl: '.rbt-modal-arrow-left',
                                    nextEl: '.rbt-modal-arrow-right',
                                    clickable: true,
                                },
                            });
                        }
                    });
                    $('.rbt-product-thumb-slider-activation').each(function (index) {
                        var $thisSlider = $(this);
                        if ($thisSlider.length > 0) {
                            new Swiper($thisSlider[0], {
                                spaceBetween: 16,
                                slidesPerView: 4,
                                freeMode: true,
                                watchSlidesProgress: true,
                            });
                        }
                    });

                    $('.rbt-product-single-slider-activation').each(function (index) {
                        var $thisSlider = $(this);
                        var $thumbSlider = $('.rbt-product-thumb-slider-activation').eq(index);

                        if ($thisSlider.length > 0 && $thumbSlider.length > 0) {
                            var swiperThumb = new Swiper($thumbSlider[0], {
                                spaceBetween: 16,
                                slidesPerView: 4,
                                freeMode: true,
                                watchSlidesProgress: true,
                                grabCursor: true,
                            });

                            new Swiper($thisSlider[0], {
                                spaceBetween: 16,
                                grabCursor: true,
                                navigation: {
                                    prevEl: '.rbt-modal-arrow-sm-left, .rbt-modal-arrow-left',
                                    nextEl: '.rbt-modal-arrow-sm-right, .rbt-modal-arrow-right',
                                },
                                thumbs: {
                                    swiper: swiperThumb,
                                },
                            });
                        }
                    });

                })
                $(document).trigger('gallery_loaded');
                $('.rbt-about-banner-slide-acivation').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            spaceBetween: 24,
                            slidesPerView: 1,
                            loop: true,
                            autoplay: {
                                delay: 4000,
                            },
                            pagination: {
                                el: '.rbt-swiper-progress',
                                clickable: true
                            },
                        });
                    }
                });

                $('.rbt-blog-banner-slide-acivation').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            loop: true,
                            autoplay: {
                                delay: 3000,
                            },
                            pagination: {
                                el: '.rbt-swiper-progress',
                                clickable: true
                            },
                            navigation: false,
                        });
                    }
                });

                $('.rbt-log-slide-activation').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            loop: true,
                            speed: 1000,
                            autoplay: {
                                delay: 3000,
                            },
                            pagination: {
                                el: '.rbt-swiper-progress',
                                clickable: true,
                            },
                        });
                    }
                });

                $('.rbt-megamenu-prd-card-activation-1').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            loop: true,
                            pagination: {
                                el: '.rbt-swiper-container .rbt-swiper-pagination',
                                clickable: true
                            },
                        });
                    }
                });

                $('.rbt-couponSwiper').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 'auto',
                            spaceBetween: 24,
                            scrollbar: {
                                el: '.swiper-scrollbar',
                                draggable: 'true',
                            },
                        });
                    }
                });

                $('.rbt-rec-prd-swiper').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: '2',
                            spaceBetween: 24,
                            scrollbar: {
                                el: '.swiper-scrollbar',
                                draggable: true,
                            },
                            breakpoints: {
                                320: {
                                    slidesPerView: 1,
                                },
                                600: {
                                    slidesPerView: 2,
                                },
                            },
                        });
                    }
                });


                $('.rbt-text-swiper-container').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        var swiperInstance = new Swiper($thisSlider[0], {
                            loop: true,
                            slidesPerView: '1',
                            direction: 'vertical',
                            effect: 'slide',
                            autoplay: {
                                delay: 2000,
                                reverseDirection: true,
                                disableOnInteraction: false,
                            },
                            navigation: {
                                prevEl: '.rbt-arrow-vertical .rbt-arrow-prev',
                                nextEl: '.rbt-arrow-vertical .rbt-arrow-next',
                                clickable: true,
                            },
                            effect: 'slide',
                        });

                        $thisSlider[0].addEventListener('mouseenter', function () {
                            swiperInstance.autoplay.stop();
                        });

                        $thisSlider[0].addEventListener('mouseleave', function () {
                            swiperInstance.autoplay.start();
                        });
                    }
                });

                $('.rbt-coupon-slide-active').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 'auto',
                            grabCursor: true,
                            spaceBetween: 16,
                            speed: 1000,
                            scrollbar: {
                                el: '.swiper-scrollbar',
                                draggable: true,
                            },
                        });
                    }
                });

                $('.rbt-insta-slider-activation').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 'auto',
                            grabCursor: true,
                            spaceBetween: 15,
                            loop: true,
                            speed: 1000,
                            autoplay: {
                                delay: 1500,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true,
                            }
                        });
                    }
                });

                $('.rbt-splash-feature-slide-active').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            spaceBetween: 24,
                            speed: 1500,
                            loop: true,
                            grabCursor: true,
                            autoplay: {
                                delay: 2000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true,
                            },
                            pagination: {
                                el: '.rbt-swiper-pagination-var-one',
                                clickable: true
                            },
                        });
                    }
                });

                $('.rbt-feature-slide-active').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            direction: 'vertical',
                            slidesPerView: 4,
                            spaceBetween: 16,
                            speed: 1500,
                            loop: true,
                            grabCursor: true,
                            centeredSlides: true,
                            autoplay: {
                                delay: 1500,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true,
                            }
                        });
                    }
                });

                $('.splash-element-presentation-active').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 'auto',
                            spaceBetween: 32,
                            speed: 9000,
                            loop: true,
                            grabCursor: true,
                            autoplay: {
                                delay: 0,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true,
                            }
                        });
                    }
                });

                $('.rbt-splash-cart-layout-active').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 'auto',
                            spaceBetween: 32,
                            grabCursor: true,
                            autoplay: true,
                            speed: 1000,
                            delay: 0,
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            breakpoints: {
                                320: {
                                    spaceBetween: 24,
                                },
                                768: {
                                    spaceBetween: 32,
                                }
                            }
                        });
                    }
                });
                $('.rbt-splash-component-slider-active').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 'auto',
                            spaceBetween: 48,
                            grabCursor: true,
                            loop: true,
                            speed: 1000,
                            autoplay: true,
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            }
                        });
                    }
                });

                $('.rbt-mobile-view-slide-active').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 'auto',
                            spaceBetween: 24,
                            grabCursor: true,
                            loop: true,
                            speed: 800,
                            autoplay: true,
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            },
                            pagination: {
                                el: '.rbt-swiper-container .rbt-swiper-pagination',
                                clickable: true
                            },
                        });
                    }
                });

                $('.rbt-splash-megamenu-slider-active').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 'auto',
                            spaceBetween: 32,
                            speed: 9000,
                            loop: true,
                            autoplay: {
                                delay: 0,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true,
                            }
                        });
                    }
                });

                $('.rbt-product-slider-activation-1').each(function () {
                    var $thisSlider = $(this);
                    if ($thisSlider.length > 0) {
                        new Swiper($thisSlider[0], {
                            slidesPerView: 1,
                            speed: 1000,
                            grabCursor: true,
                            navigation: {
                                prevEl: '.rbt-arrow-left',
                                nextEl: '.rbt-arrow-right',
                                clickable: true,
                            }
                        })
                    }
                })


            };
            initializeSwipers();

        },

        counterUp: function () {
            var odo = $('.odometer');
            odo.each(function () {
                $('.odometer').appear(function (e) {
                    var countNumber = $(this).attr('data-count');
                    $(this).text(countNumber);
                });
            });

            $('.rbt-initial-odo-count').hover(
                function () {
                    const odometerElement = $(this).find('.odometer');
                    const targetValue = odometerElement.data('count');
                    odometerElement.text(targetValue);
                },
                function () {
                    $(this).find('.odometer').text('00');
                }
            );
        },


        stickyHeader: function () {
            // Header Transparent
            if ($('header').hasClass('header-transparent')) {
                $('body').addClass('active-header-transparent')
            } else {
                $('body').removeClass('active-header-transparent')
            }
        },


        marqueImage: function () {
            $('.rbtmarque').each(function () {
                var t = 0;
                var i = 1;
                var $this = $(this);
                setInterval(function () {
                    t += i;
                    $this.css('background-position-x', -t + 'px');
                }, 10);
            });
        },


        popupMobileMenu: function () {
            $('.hamberger-button').on('click', function (e) {
                $('.popup-mobile-menu').addClass('active');
            });

            $('.close-button').on('click', function (e) {
                $('.popup-mobile-menu').removeClass('active');
                $('.popup-mobile-menu .mainmenu .has-dropdown > a, .popup-mobile-menu .mainmenu .with-rbt-megamenu > a').siblings('.submenu, .rbt-megamenu').removeClass('active').slideUp('400');
                $('.popup-mobile-menu .mainmenu .has-dropdown > a, .popup-mobile-menu .mainmenu .with-rbt-megamenu > a').removeClass('open')
            });

            $('.popup-mobile-menu .mainmenu .has-dropdown > a, .popup-mobile-menu .mainmenu .with-rbt-megamenu > a').on('click', function (e) {
                e.preventDefault();
                $(this).siblings('.submenu, .rbt-megamenu').toggleClass('active').slideToggle('400');
                $(this).toggleClass('open')
            })

            $('.popup-mobile-menu, .popup-mobile-menu .mainmenu.onepagenav li a').on('click', function (e) {
                e.target === this && $('.popup-mobile-menu').removeClass('active') && $('.popup-mobile-menu .mainmenu .has-dropdown > a, .popup-mobile-menu .mainmenu .with-rbt-megamenu > a').siblings('.submenu, .rbt-megamenu').removeClass('active').slideUp('400') && $('.popup-mobile-menu .mainmenu .has-dropdown > a, .popup-mobile-menu .mainmenu .with-rbt-megamenu > a').removeClass('open');
            });
        },

        headerSticky: function () {
            var $window = $(window);
            var $body = $('body');
            var $stickyPlaceHolder = $('.rbt-sticky-placeholder');
            var $headerContainer = $('.rbt-header-sticky-activation');
            var $headerContainerCommon = $('.rbt-header-common-sticky-activation');
            var ticking = false;

            if (!$headerContainer.length && !$headerContainerCommon.length) {
                return;
            }

            function updateStickyHeader() {
                ticking = false;

                if (!$body.hasClass('rbt-header-sticky')) {
                    return;
                }

                var headerContainerH = $headerContainer.outerHeight() || 0;
                var topHeaderH = $('.rbt-header-top').outerHeight() || 0;
                var targetScroll = topHeaderH + 200;
                var shouldStick = $window.scrollTop() > targetScroll;

                $headerContainer.toggleClass('rbt-sticky', shouldStick);
                $headerContainerCommon.toggleClass('rbt-sticky', shouldStick);
                $stickyPlaceHolder.height(shouldStick ? headerContainerH : 0);

                if ($headerContainerCommon.length > 0) {
                    $headerContainer.removeClass('rbt-sticky');
                }
            }

            function requestStickyHeaderUpdate() {
                if (ticking) {
                    return;
                }

                ticking = true;
                (requestAnimationFrame || setTimeout)(updateStickyHeader);
            }

            $window.on('scroll', requestStickyHeaderUpdate);
            updateStickyHeader();
        },

        transparentHeader: function () {
            if ($('.rbt-header').hasClass('rbt-transparent-header')) {
                var mainHeader = $('.rbt-header').outerHeight();
                $('body').addClass('rbt-header-transpernt-active');
                $('.header-transperent-spacer').css('padding-top', mainHeader + 'px');
            }
        },

        categoryMenuHover: function () {
            $('.vertical-nav-menu li.vertical-nav-item').mouseover(function () {
                $('.rbt-vertical-inner').hide();
                $('.vertical-nav-menu li.vertical-nav-item').removeClass('active');
                $(this).addClass('active');
                var selected_tab = $(this).find('a').attr('href');
                $(selected_tab).stop().fadeIn();
                return false;
            });
        },

        selectPickerActivation: function () {
            $('.rbt-select-activation').selectpicker();
            $('.rbt-select-icon-only').each(function () {
                var $select = $(this);
                var $button = $select.siblings('.dropdown-toggle');

                if (!$button.length) {
                    $button = $select.closest('.bootstrap-select').find('> .dropdown-toggle');
                }

                if (!$button.length) {
                    return;
                }

                // Keep the sort trigger icon-only after selection changes.
                $button.find('.filter-option-inner-inner').html('&nbsp;');
            });
        },

        headerTopActivation: function () {
            $('.bgsection-activation').on('click', function () {
                $(this).parents('.rbt-header-campaign').addClass('deactive')
            })
        },

        showMoreBtn: function () {
            $.fn.hasShowMore = function () {
                return this.each(function () {
                    $(this).toggleClass('active');
                    var buttonText = $(this).find('button').text() === 'Show More' ? 'Show Less' : 'Show More';
                    $(this).find('button').text(buttonText);
                    $(this).parent('.rbt-has-show-more').toggleClass('active');
                });
            };
            $(document).on('click', '.rbt-show-more-btn-area', function () {
                $(this).hasShowMore();
            });
        },

        colorSwitcherActivation: function () {
            jQuery('.rbt-switcher-color-activation li a ').click(function (event) {
                jQuery(this).closest(jQuery('.rbt-switcher-color-activation')).find('li a').removeClass('active');
                jQuery(this).toggleClass('active');
                event.preventDefault();
            });
        },

        productSwitcherActivation: function () {
            $('[data-switcher-color]').each(function () {
                const color = $(this).attr('data-switcher-color') || '#ffffff';
                $(this).find('.rbt-color-circle').css('background-color', color);
            });

            $(document).on('click', '.product-switcher-activation li a', function (event) {
                event.preventDefault();

                const $this = $(this);
                const value = $this.attr('data-src');
                const $switcher = $this.closest('.product-switcher-activation');
                const $card = $this.closest('.rbt-card');
                const $cardImage = $card.find('> .rbt-card-img').first();
                let $primaryImage = $cardImage.find('.rbt-prd-img').first();

                $switcher.find('li').removeClass('active');
                $this.closest('li').addClass('active');

                if (!value) {
                    console.warn('No data-src attribute found.');
                    return;
                }

                if (!$primaryImage.length) {
                    $primaryImage = $cardImage.find('> a img').first();
                }

                if ($primaryImage.length) {
                    $primaryImage.attr('src', value);
                } else {
                    console.warn('No product image target found for switcher.');
                }
            });
        },

        productOnclickSlider: function () {
            $('.click-slider-activation li a').click(function () {

                $(this).closest('.click-slider-activation').find('li a').removeClass('active');

                $(this).closest('.click-slider-activation li a').addClass('active');

                var value = $(this).attr('data-src');
                $(this).closest('.rbt-card-img').find('a img').attr('src', value);
            });
        },

        productHoverSlider: function () {
            $(document).on('mouseover click', '.hover-slider-activation li a', function (e) {
                const $this = $(e.target);

                $this.closest('.hover-slider-activation').find('li a').removeClass('active');

                $this.closest('.hover-slider-activation li a').addClass('active');

                var value = $this.attr('data-src');
                $this.closest('.rbt-card-img').find('a img').attr('src', value);
            });
        },

        tooltipsActivation: function () {
            $(document).ready(function () {
                $('.tooltips').each(function () {
                    const position = $(this).data('tooltip-position') || 'top';
                    const tooltipText = $(this).attr('data-tooltip') || '';
                    const hasDistanceClass = $(this).hasClass('tooltip-distance-lg');

                    new bootstrap.Tooltip(this, {
                        title: tooltipText,
                        placement: position,
                        trigger: 'hover',
                        offset: '0, 8',
                        template: `<div class='tooltip ${hasDistanceClass ? 'tooltip-distance-lg' : ''}' role='tooltip'>
                                <div class='tooltip-arrow'></div>
                                <div class='tooltip-inner'></div>
                              </div>`,
                    });
                });

                // Wishlist button logic
                $('.rbt-wishlisted-btn').click(function () {
                    const tooltip = bootstrap.Tooltip.getInstance(this);
                    $(this).addClass('added-wishlist');

                    $('.rbt-toaster-wishlist').addClass('is-visible');
                    setTimeout(() => {
                        $('.rbt-toaster-wishlist').removeClass('is-visible');
                    }, 3000);

                    if (tooltip._config.title === 'Add to wishlist') {
                        tooltip.setContent({ '.tooltip-inner': 'Browse Wishlist' });
                    } else {
                        window.location.href = 'wishlist.html';
                    }
                });

                // Compare button logic
                $('.rbt-compare-btn').click(function () {
                    const tooltip = bootstrap.Tooltip.getInstance(this);
                    $(this).addClass('added-compare');

                    $('.rbt-toaster-compare').addClass('is-visible');
                    setTimeout(() => {
                        $('.rbt-toaster-compare').removeClass('is-visible');
                    }, 1500);

                    if (tooltip._config.title === 'Add to compare') {
                        tooltip.setContent({ '.tooltip-inner': 'Browse Compare' });
                    } else {
                        window.location.href = 'compare-product.html';
                    }
                });

                // Button activation logic
                $('.rbt-compare-btn-activation').click(function (e) {
                    e.preventDefault();
                    const $button = $(this);
                    const $toaster = $('.rbt-toaster-compare');

                    $button.addClass('added-compare');
                    $toaster.addClass('is-visible');

                    setTimeout(() => {
                        $toaster.removeClass('is-visible');
                    }, 1500);
                });
            });


        },
        responsivelookbookView: function () {
            function responsiveView() {
                const width = $(window).width() > 992;
                if (!width) {
                    $('.rbt-dot-lookbok-product-wrapper').css('opacity', '0');
                    $('.rbt-dot-lookbok-product-wrapper').css('visibility', 'hidden');
                    $('.rbt-dot-lookbok-product-wrapper').on('click', function () {
                        $(this).closest('.rbt-lookbook-portion').find('.rbt-dot-lookbok-product-wrapper').css('opacity', '0');
                        $(this).closest('.rbt-lookbook-portion').find('.rbt-dot-lookbok-product-wrapper').css('visibility', 'hidden');
                        $(this).closest('.rbt-lookbook-portion').find('.rbt-dot-lookbok-product-wrapper').css('z-index', '-1');
                    })
                    $('.rbt-lookbook-dot').on('click', function () {
                        $(this).closest('.rbt-lookbook-portion').find('.rbt-dot-lookbok-product-wrapper').css('opacity', '1');
                        $(this).closest('.rbt-lookbook-portion').find('.rbt-dot-lookbok-product-wrapper').css('visibility', 'visible');
                        $(this).closest('.rbt-lookbook-portion').find('.rbt-dot-lookbok-product-wrapper').css('z-index', '99');
                    })
                } else {
                    $('.rbt-dot-lookbok-product-wrapper').css('opacity', '1');
                    $('.rbt-dot-lookbok-product-wrapper').css('visibility', 'visible');
                    $('.rbt-dot-lookbok-product-wrapper').css('z-index', '99');
                }
            }
            responsiveView();
            $(window).on('resize', function () {
                responsiveView();
            });
        },
        clickDoc: function () {
            $('.search-trigger-active').click(function (e) {
                e.preventDefault();
                var $button = $(this);
                var $searchDropdown = $('.rbt-search-dropdown-activation');
                $button.toggleClass('open');
                $searchDropdown.toggleClass('active');
                rbtJs._html.toggleClass('header-top-menu-nav-opened');
            });
            $('.common-close_search_dropdown').on('click', function () {
                $('.search-trigger-active').removeClass('open');
                $('.rbt-search-dropdown-activation').removeClass('active');
                rbtJs._html.removeClass('header-top-menu-nav-opened');
            })

            $('.rbt-common-search-trigger-active').click(function (e) {
                e.preventDefault();
                var $button = $(this);
                var $searchDropdown = $('.rbt-common-search-dropdown-activation');
                $button.toggleClass('open');
                $searchDropdown.toggleClass('active');
                rbtJs._html.toggleClass('menu-nav-opened');
                $('.common-close_search_dropdown').on('click', function () {
                    setTimeout(function () {
                        $button.removeClass('open');
                        $searchDropdown.removeClass('active');
                        rbtJs._html.removeClass('menu-nav-opened');
                    }, 300);
                });
            });

            $(window).scroll(function () {
                $('.search-trigger-active').removeClass('open');
                $('.rbt-search-dropdown-activation').removeClass('active');
                $('.rbt-common-search-trigger-active').removeClass('open');
                $('.rbt-common-search-dropdown-activation').removeClass('active');
                rbtJs._html.removeClass('menu-nav-opened');
                rbtJs._html.removeClass('header-top-menu-nav-opened');
            });
        },
        headermenuHover: function () {
            let timer;
            $(document).ready(function () {
                $('.rbt-mainmenu-nav li.with-rbt-megamenu, .rbt-mainmenu-nav li.has-dropdown').hover(
                    function () {
                        clearTimeout(timer);
                        rbtJs._html.addClass('header-top-menu-nav-opened');
                    },
                    function () {
                        timer = setTimeout(() => {
                            rbtJs._html.removeClass('header-top-menu-nav-opened');
                        }, 200);
                    }
                );
            });
        },

        videoStyleHover: function () {
            const video = document.querySelectorAll('.video');
            const pauseBtn = document.querySelectorAll('.pause-btn');
            const videoContainer = document.querySelectorAll('.video-container');
            let timeout;

            if (video && pauseBtn.length && videoContainer.length) {
                const updatePauseButtonPosition = (event) => {
                    videoContainer.forEach(container => {
                        const rect = container.getBoundingClientRect();
                        const x = event.clientX - rect.left;
                        const y = event.clientY - rect.top;
                        pauseBtn.forEach(btn => {
                            btn.style.left = x + 'px';
                            btn.style.top = y + 'px';
                        })
                    })
                };

                const hidePauseButton = () => {
                    pauseBtn.forEach(btn => {
                        btn.style.display = 'none';
                    })
                };

                videoContainer.forEach(container => {
                    container.addEventListener('mousemove', (event) => {
                        pauseBtn.forEach(btn => {
                            btn.style.display = 'flex';
                        })
                        updatePauseButtonPosition(event);
                        clearTimeout(timeout);
                        timeout = setTimeout(hidePauseButton, 2000);
                    });
                })

                videoContainer.forEach(container => {
                    container.addEventListener('mouseleave', hidePauseButton);
                })

                $('.video-container video').on('click', function () {
                    const vd = $(this).get(0);
                    if (vd.paused) {
                        vd.play();
                        pauseBtn.forEach(btn => {
                            btn.innerHTML = 'PAUSE <br> VIDEO';
                        })
                    } else {
                        vd.pause();
                        pauseBtn.forEach(btn => {
                            btn.innerHTML = 'PLAY <br> VIDEO';
                        })
                    }
                })
            }
        },
        rbtPriceRangeBar: function () {
            $('#rbt-slider-range').slider({
                range: true,
                min: 30,
                max: 1700,
                values: [30, 1700],
                slide: function (event, ui) {
                    $('#amount').val('$' + ui.values[0] + ' - $' + ui.values[1]);
                }
            });
            $('#amount').val('$' + $('#rbt-slider-range').slider('values', 0) +
                ' - $' + $('#rbt-slider-range').slider('values', 1));
        },

        rbtMagneticBtn: function () {
            const buttons = document.querySelectorAll('.rbt-magnetic-button');
            const strength = 80;

            buttons.forEach(button => {
                button.addEventListener('mousemove', (event) => {
                    const rect = button.getBoundingClientRect();
                    const buttonCenterX = rect.left + rect.width / 2;
                    const buttonCenterY = rect.top + rect.height / 2;
                    const mouseX = event.clientX;
                    const mouseY = event.clientY;


                    const deltaX = mouseX - buttonCenterX;
                    const deltaY = mouseY - buttonCenterY;

                    const angle = Math.atan2(deltaY, deltaX);
                    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

                    const maxDistance = Math.min(strength, distance);

                    const offsetX = maxDistance * Math.cos(angle);
                    const offsetY = maxDistance * Math.sin(angle);

                    button.style.transition = 'transform 0.3s ease-out';
                    button.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1.09)`;
                });

                button.addEventListener('mouseleave', () => {
                    button.style.transition = 'transform 0.3s ease-out';
                    button.style.transform = 'translate(0, 0) scale(1)';
                });
            });

        },

        rbtDragdropArea: function () {
            var dragDropArea = $('.rbt-file-upload-container');
            dragDropArea.each(function () {
                const fileUploadArea = this.querySelector('.fileUploadArea');
                const fileInput = this.querySelector('.fileInput');
                const browseFilesButton = this.querySelector('.browseFilesButton');
                const fileCount = this.querySelector('.fileCount');
                const fileList = this.querySelector('.fileList');

                let fileCounter = 0;
                const maxFiles = 10;
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg', 'image/gif'];

                fileUploadArea.addEventListener('dragover', (event) => {
                    event.preventDefault();
                    fileUploadArea.classList.add('dragging');
                });

                fileUploadArea.addEventListener('dragleave', () => {
                    fileUploadArea.classList.remove('dragging');
                });

                fileUploadArea.addEventListener('drop', (event) => {
                    event.preventDefault();
                    fileUploadArea.classList.remove('dragging');
                    handleFiles(event.dataTransfer.files);
                });

                browseFilesButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    fileInput.click();
                });

                fileInput.addEventListener('change', () => {
                    handleFiles(fileInput.files);
                });

                function handleFiles(files) {
                    const fileArray = Array.from(files);
                    fileArray.forEach(file => {
                        if (!allowedTypes.includes(file.type)) {
                            alert(`File type not allowed: ${file.name}`);
                            return;
                        }
                        if (fileCounter < maxFiles) {
                            fileCounter++;
                            displayFile(file);
                            updateFileCount();
                        } else {
                            alert('Maximum file limit reached');
                        }
                    });
                }

                function displayFile(file) {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';

                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'rbt_store_product_custom_images[]';
                    hiddenInput.value = file.name;

                    const fileName = document.createElement('span');
                    fileName.className = 'file-name';
                    fileName.textContent = file.name;

                    const cancelButton = document.createElement('button');
                    cancelButton.type = 'button';
                    cancelButton.className = 'cancel-button';
                    cancelButton.setAttribute('aria-label', `Remove ${file.name}`);

                    const cancelIcon = document.createElement('i');
                    cancelIcon.className = 'fa-solid fa-xmark';
                    cancelIcon.setAttribute('aria-hidden', 'true');
                    cancelButton.appendChild(cancelIcon);
                    cancelButton.addEventListener('click', () => {
                        fileItem.remove();
                        fileCounter--;
                        updateFileCount();
                    });

                    fileItem.appendChild(hiddenInput);
                    fileItem.appendChild(fileName);
                    fileItem.appendChild(cancelButton);
                    fileList.appendChild(fileItem);
                }

                function updateFileCount() {
                    fileCount.textContent = `${fileCounter} of ${maxFiles}`;
                }
            });
        },

        videoPoput: function () {
            Fancybox.bind('[data-fancybox]', {
                buttons: [
                    'slideShow',
                    'share',
                    'zoom',
                    'fullScreen',
                    'close'
                ],
                youtube: {
                    controls: 1,
                    showinfo: 0
                },
                vimeo: {
                    color: 'f00'
                },
                Carousel: {
                    infinite: false,
                    Panzoom: {
                        decelFriction: 0.5
                    }
                },
            });

            Fancybox.bind('[data-fancybox]', {
                Thumbs: {
                    type: 'classic',
                },
            });
            Fancybox.bind('[data-fancybox="product-single-gallary"]', {
                Thumbs: {
                    type: 'classic',
                },
            });
        },

        // onepage navigation
        onePageNav: function () {
            $('.rbt-onepagenav', '.onepagenav').each(function () {
                $(this).onePageNav({
                    currentClass: 'current',
                    changeHash: false,
                    scrollSpeed: 500,
                    scrollThreshold: 0.4,
                    filter: '',
                    easing: 'swing',
                });
            })
        },

        // sticky top one page navigation
        stickyBrandList: function () {
            $(window).scroll(function () {
                $('.rbt-brand-char-list-sticky').toggleClass('sticky', $(this).scrollTop() > 200)
            })
        },

        // copy link
        copyLink: function () {
            let $copyBtn = $('.rbt-text-copy-activation .rbt-copy-btn');
            if ($copyBtn.length > 0) {
                $($copyBtn).on('click', function (e) {
                    e.preventDefault();
                    let $input = $(this).closest('.rbt-text-copy-activation').find('.rbt-copy-value-field');
                    let $copyButton = $(this).closest('.rbt-text-copy-activation').find('.rbt-copy-btn');
                    $input.select();
                    document.execCommand('copy');
                    $(e.currentTarget).attr('data-tooltip', 'Copied!');
                });
                $($copyBtn).on('mouseover', function (e) {
                    $(e.currentTarget).attr('data-tooltip', 'Copy');
                })
            }
        },

        openOffcanvasPopup: function () {
            function resetAll() {
                $('.rbt-sidebar-cart').removeClass('open-popup-overlay');
                $('.rbt-offcanvas-inner-popup-card').removeClass('open-note-popup open-shipping-popup open-coupon-popup');
            }

            $('.rbt-note-btn').click(function (e) {
                e.preventDefault();
                resetAll();
                var sidebarcart = $(this).closest('.rbt-sidebar-cart');
                var popupCard = sidebarcart.find('.rbt-offcanvas-inner-popup-card');
                sidebarcart.addClass('open-popup-overlay');
                popupCard.addClass('open-note-popup');
            });

            $('.rbt-shipping-btn').click(function (e) {
                e.preventDefault();
                resetAll();
                var sidebarcart = $(this).closest('.rbt-sidebar-cart');
                var popupCard = sidebarcart.find('.rbt-offcanvas-inner-popup-card');
                sidebarcart.addClass('open-popup-overlay');
                popupCard.addClass('open-shipping-popup');
            });

            // Coupon card open
            $('.rbt-coupon-btn').click(function (e) {
                e.preventDefault();
                resetAll();
                var sidebarcart = $(this).closest('.rbt-sidebar-cart');
                var popupCard = sidebarcart.find('.rbt-offcanvas-inner-popup-card');
                sidebarcart.addClass('open-popup-overlay');
                popupCard.addClass('open-coupon-popup');
            });

            // Close popup
            $('.rbt-popup-close-btn').click(function (e) {
                e.preventDefault();
                var sidebarcart = $(this).closest('.rbt-sidebar-cart');
                var popupCard = sidebarcart.find('.rbt-offcanvas-inner-popup-card');
                popupCard.removeClass('open-note-popup open-shipping-popup open-coupon-popup');
                sidebarcart.removeClass('open-popup-overlay');
            });
        },

        // open tab contents
        openTabItems: function () {
            var tabLink = $('.rbt-sidebar-sub-categories .rbt-nav-link');
            var closeButton = $('.rbt-sidebar-close-btn');
            var tabContent = $('.rbt-sidebar-right-content');
            var offCanvas = $('.rbt-offcanvas-cat-side-menu');

            tabLink.click(function () {
                tabContent.addClass('active')
            });

            closeButton.click(function () {
                tabContent.removeClass('active')
            })

            $('.close_side_menu').click(function () {
                tabContent.removeClass('active')
                $('.rbt-sidebar-sub-categories .rbt-nav-link').removeClass('active')
            })
        },

        // calculate sidebar height
        calculateSidebarHeight: function () {
            var vh = $(window).height();
            var sidebarHeader = $('.rbt-categories-sidebar .rbt-sidebar-left-content-head').outerHeight();
            var sidebarFooter = $('.rbt-categories-sidebar .rbt-sidebar-left-content-footer').outerHeight();

            $('.rbt-categories-sidebar .rbt-sidebar-tabs-wrapper .rbt-sidebar-tabs-inner').height(vh - (sidebarHeader + sidebarFooter)).css({
                'margin-bottom': `${sidebarFooter}px`,
            });
        },

        elevatezoomActivation: function () {
            $('.zoom_window, .zoom_lens, .zoom_inner, .zoom_03').each(function () {
                // Zoom Window
                $(this).elevateZoom({
                    zoomType: 'window',
                    zoomWindowWidth: 200,
                    zoomWindowHeight: 200,
                    zoomWindowPosition: 1,
                    zoomWindowFadeIn: 500,
                    zoomWindowFadeOut: 750,
                    borderSize: 2,
                    borderColour: '#888',
                    zoomWindowOffetx: 10,
                    zoomWindowOffety: 10,
                    lensOpacity: 0.5
                });
                // Zoom Lens
                $(this).elevateZoom({
                    zoomType: 'lens',
                    lensShape: 'round',
                    lensSize: 200,
                    borderSize: 1,
                    containLensZoom: true,
                    responsive: true,
                    cursor: 'pointer',
                    lensFadeIn: 500,
                    lensFadeOut: 500,
                    scrollZoom: true,
                    lensBorderColour: '#000'
                });
                // Zoom Inner
                $(this).elevateZoom({
                    zoomType: 'inner',
                    cursor: 'crosshair',
                    zoomLevel: 1.5,
                    responsive: true,
                    zoomWindowFadeIn: 300,
                    zoomWindowFadeOut: 300,
                });
                // Gallery Zoom
                $(this).elevateZoom({
                    gallery: 'gallery_01',
                    cursor: 'pointer',
                    easing: true,
                    galleryActiveClass: 'active',
                    imageCrossfade: true,
                    loadingIcon: 'https://www.elevateweb.co.uk/spinner.gif',
                    zoomActivation: 'hover',
                    zoomEnabled: true,
                    zoomLevel: 2,
                    tint: true,
                    tintColour: '#333',
                    tintOpacity: 0.5
                });
            });
        },

        miniCartBottom: function () {
            var scrollBottom = $('.rbt-minicart-bottom-section');
            $(window).scroll(function () {
                var topPos = $(this).scrollTop();
                var targetPossition = $(document).height() * 0.36;
                var filled = (($(document).scrollTop() + window.innerHeight) / $(document).height());
                if (topPos > targetPossition && filled != 1) {
                    $(scrollBottom).addClass('rbt-minicart-bottom-section-active');
                } else {
                    $(scrollBottom).removeClass('rbt-minicart-bottom-section-active')
                }
            });
        },

        searchMediaPopup: function () {
            var mediaSection = $('.rbt-media-search-section');
            var mediabgWrapper = $('.rbt-search-dropdown');
            var activationButton = $('.media-search-popupactivation');
            var closePopup = $('.rbt-ms-dismiss-btn');
            var closePopupOuter = $('.rbt-ms-dismiss-outsider');

            activationButton.click(function (e) {
                e.preventDefault();
                mediaSection.addClass('opened');
                mediabgWrapper.addClass('media-upload-wrapper-open');
                closePopupOuter.css({
                    'opacity': '1',
                    'visibility': 'visible'
                });
            });

            closePopup.click(function () {
                closePopupOuter.css({
                    'opacity': '0',
                    'visibility': 'hidden'
                });
                mediaSection.removeClass('opened');
                mediabgWrapper.removeClass('media-upload-wrapper-open');
            });

            closePopupOuter.click(function () {
                $(this).css({
                    'opacity': '0',
                    'visibility': 'hidden'
                });
                mediaSection.removeClass('opened');
                mediabgWrapper.removeClass('media-upload-wrapper-open');
            });
        },
        RbtEsAnimation: function () {
            return {
                init: function () {
                    this.animates();
                },
                animates: function () {
                    var animates = $('.rbt-scroll-trigger');
                    if (animates.length > 0) {
                        animates.each(function () {
                            $(this).on('animationend', function (e) {
                                setTimeout(function () {
                                    $(e.target).attr('animation-end', '');
                                }, 1000);
                            });
                        });
                    }
                }
            };
        },

        RbtTiktokSection: function () {
            var tikTokScriptInjected = false;

            function lazyLoadTikTok() {
                $('.tiktok-placeholder').each(function () {
                    var $this = $(this);
                    if (isInViewport($this)) {
                        var videoId = $this.data('video-id');
                        var scriptMarkup = '';

                        if (!tikTokScriptInjected && !$('script[src="https://www.tiktok.com/embed.js"]').length) {
                            tikTokScriptInjected = true;
                            scriptMarkup = "\n                        <script async src='https://www.tiktok.com/embed.js'><\\/script>";
                        }

                        var tiktokEmbed = `<blockquote class='tiktok-embed' cite='https://www.tiktok.com/@shopping__fashions/video/${videoId}' data-video-id='${videoId}' style='max-width: 605px;min-width: 325px;'>
                            <section>
                                <a target='_blank' title='@shopping__fashions' href='https://www.tiktok.com/@shopping__fashions?refer=embed'>@shopping__fashions</a>
                                <!-- Additional content -->
                            </section>
                        </blockquote>${scriptMarkup}`;
                        $this.replaceWith(tiktokEmbed);
                    }
                });
            }

            function isInViewport(element) {
                var elementTop = element.offset().top;
                var elementBottom = elementTop + element.outerHeight();
                var viewportTop = $(window).scrollTop();
                var viewportBottom = viewportTop + $(window).height();
                return elementBottom > viewportTop && elementTop < viewportBottom;
            }

            var lazyLoadTikTokRaf = (function () {
                var ticking = false;

                return function () {
                    if (ticking) {
                        return;
                    }

                    ticking = true;
                    (requestAnimationFrame || setTimeout)(function () {
                        ticking = false;
                        lazyLoadTikTok();
                    });
                };
            })();

            $(window).on('scroll resize', lazyLoadTikTokRaf);
            lazyLoadTikTok();
        },

        openComparison: function () {
            $('.rbt-compare-bottom-sidenav-activation').click(function (e) {
                e.preventDefault();
                $('.rbt-comparison-message-area').addClass('comparison-active');
                $('body').addClass('offcanvas-menu-active');
            });
            $('.close-canvas-btn').click(function () {
                $('.rbt-comparison-message-area').removeClass('comparison-active');
                $('body').removeClass('offcanvas-menu-active');
            });
            $('.close_side_menu').on('click', function () {
                $('.rbt-comparison-message-area').removeClass('comparison-active');
                $('body').removeClass('offcanvas-menu-active');
            });
        },

        openQuickviewsidenav: function () {
            $('.rbt-quickview-sidenav-activation').click(function (e) {
                e.preventDefault();
                $('.rbt-quickview-sidenav-area').addClass('quickview-sidenav-active');
                $('body').addClass('offcanvas-menu-active');
            });
            $('.close-canvas-btn').click(function () {
                $('.rbt-quickview-sidenav-area').removeClass('quickview-sidenav-active');
                $('body').removeClass('offcanvas-menu-active');
            });
            $('.close_side_menu').on('click', function () {
                $('.rbt-quickview-sidenav-area').removeClass('quickview-sidenav-active');
                $('body').removeClass('offcanvas-menu-active');
            });
        },

        showProductOptions: function () {
            $('.rbt-product-search-select-field').focus(function () {
                $('.rbt-product-search-dropdown').addClass('show-dropdown');
            })
            $('.rbt-product-search-select-field').blur(function () {
                $('.rbt-product-search-dropdown').removeClass('show-dropdown');
            })
        },

        RbtnavEffectActivation: function () {
            function updateBackground($activeItem, $backgroundHighlight) {
                if (!$activeItem || !$activeItem.length) return;

                const itemOffset = $activeItem.offset();
                const menuOffset = $activeItem.closest('.rbt-nav-effect-activation').offset();

                $backgroundHighlight.css({
                    width: $activeItem.outerWidth(),
                    height: $activeItem.outerHeight(),
                    left: itemOffset.left - menuOffset.left,
                    top: itemOffset.top - menuOffset.top
                });
            }

            function initializeNavEffectActivation(container) {
                const $menuItems = $(container).find('ul li a, .rbt-tab-btn-list button');
                const $menuItemsHover = $(container).find('ul.has-hover-effect li a');
                const $backgroundHighlight = $(container).find('.rbt-bg-highlight');

                updateBackground($(container).find('a.active, button.active'), $backgroundHighlight);

                $menuItems.each(function () {

                    $(this).on('click', function (e) {
                        e.preventDefault();

                        $menuItems.removeClass('active');
                        $(this).addClass('active');
                        updateBackground($(this), $backgroundHighlight);
                    });
                });

                $menuItemsHover.each(function () {
                    $(this).on('mouseenter', function () {
                        updateBackground($(this), $backgroundHighlight);
                        $menuItems.removeClass('active');
                        $(this).addClass('active');
                    });

                    $(this).on('mouseleave', function () {
                        updateBackground($(container).find('a.active, button.active'), $backgroundHighlight);
                    });
                });

                $(container).on('mouseleave', function () {
                    $menuItems.removeClass('hovered');
                    updateBackground($(container).find('a.active, button.active'), $backgroundHighlight);
                });
            }

            $('.rbt-nav-effect-activation').each(function () {
                initializeNavEffectActivation(this);
            });
        },

        RbtcartCountdown: function () {
            var countdownDuration = 10 * 60;
            var countdownDisplay = $('.rbt-countdown-cart');
            var countdownInterval = null;

            function startCountdown(duration, display) {
                var timer = duration, minutes, seconds;

                countdownInterval = setInterval(function () {
                    minutes = Math.floor(timer / 60);
                    seconds = timer % 60;

                    minutes = minutes < 10 ? '0' + minutes : minutes;
                    seconds = seconds < 10 ? '0' + seconds : seconds;

                    display.text(minutes + 'm ' + seconds + 's');

                    if (--timer < 0) {
                        clearInterval(countdownInterval);
                        display.text('Time\'s up!');
                        countdownInterval = null;
                    }
                }, 1000);
            }

            function resetCountdown() {
                clearInterval(countdownInterval);
                countdownDisplay.text('10m 00s');
                countdownInterval = null;
            }

            var body = $('body');

            setInterval(function () {
                if (body.hasClass('cart-sidenav-menu-active')) {
                    if (!countdownInterval) {
                        startCountdown(countdownDuration, countdownDisplay);
                    }
                } else {
                    resetCountdown();
                }
            }, 100);
        },

        RbtbottomTools: function () {
            $(window).scroll(function () {
                var scrollTop = $(window).scrollTop();

                var threshold = 400;

                if (scrollTop >= threshold) {
                    $('.rbt-toolbar').addClass('visible');
                } else {
                    $('.rbt-toolbar').removeClass('visible');
                }
            });
        },

        RbthoverTab: function () {
            function handleTabHover(tabActivationClass) {
                $(tabActivationClass + ' .nav-link').hover(function () {
                    const $this = $(this);
                    const parentWrapper = $this.closest('.rbt-megamenu-wrapper');
                    const currentURL = $this.attr('href') || $this.data('bs-target');
                    const targetTab = parentWrapper.find(currentURL);

                    $(tabActivationClass + ' .nav-link').removeClass('active');
                    parentWrapper.find('.tab-pane.active').removeClass('show active');

                    $this.addClass('active');
                    if (targetTab.length) {
                        targetTab.addClass('show active');
                    }
                });
            }
            handleTabHover('.rbt-megamenu-tab-activation');
            handleTabHover('.rbt-megamenu-tab-cs-activation');
        },

        RbtcollapseText: function () {
            var $collapseButton = $('.rbt-filter-activation');
            var $collapseElement = $('.rbt-filter-collapse-area');
            var $toggleButtonText = $('.rbt-filter-activation .filter-text');
            var $productArea = $('.rbt-collapsible-filter-product-area');
            var windowWidth = $(window).width();

            $collapseButton.on('click', function (e) {
                e.preventDefault();

                if (windowWidth >= 992) {
                    // Desktop behavior (toggle filter)
                    $collapseElement.toggleClass('show');
                    $collapseButton.toggleClass('active');
                    $productArea.toggleClass('shift-right');

                    if ($collapseButton.hasClass('active')) {
                        $toggleButtonText.text('Hide Filter');
                    } else {
                        $toggleButtonText.text('Show Filter');
                    }
                } else {
                    // Mobile behavior (open as offcanvas)

                    e.preventDefault();
                    $('.side-menu').addClass('side-menu-active'),
                        $('body').addClass('offcanvas-menu-active')

                    $('.close_side_menu').on('click', function () {
                        $('.side-menu').removeClass('side-menu-active'),
                            $('body').removeClass('offcanvas-menu-active')
                    }),

                        $('.side-menu .side-nav .navbar-nav li a').on('click', function () {
                            $('.side-menu').removeClass('side-menu-active'),
                                $('body').removeClass('offcanvas-menu-active')
                        }),

                        $('.rbt-sidebar-close-btn').on('click', function () {
                            $('.side-menu').removeClass('side-menu-active'),
                                $('body').removeClass('offcanvas-menu-active')
                        });
                }
            });

            // Close the offcanvas on mobile
            $('.rbt-filter-offcanvas .close-btn').on('click', function () {
                $('.rbt-filter-offcanvas').removeClass('open');
            });
        },

        RbtImgSelect: function () {
            $('.rbt-check-green').change(function () {
                var label = $('label[for="' + $(this).attr("id") + '"]');

                if ($(this).is(':checked')) {
                    label.addClass('selected');
                } else {
                    label.removeClass('selected');
                }
            });
        },

        RbtsearchPlaceholderSlider: function () {
            $('.rbt-inner-search-label-animate-activation input').on('focus', function () {
                $('.rbt-inner-search-label-animate-activation .cd-words-wrapper').css('opacity', '0');
            });

            $('.rbt-inner-search-label-animate-activation input').on('blur', function () {
                if ($(this).val() === '') {
                    $('.rbt-inner-search-label-animate-activation .cd-words-wrapper').css('opacity', '1');
                } else {
                    $('.rbt-inner-search-label-animate-activation .cd-words-wrapper').css('opacity', '0');
                }
            });
        },

        pricingPlan: function () {
            var mainPlan = $('.rbt-pricing-area');
            mainPlan.each(function () {
                var $this = $(this),
                    yearlySelectBtn = $this.find('.yearly-plan-btn'),
                    monthlySelectBtn = $this.find('.monthly-plan-btn'),
                    monthlyPrice = $this.find('.monthly-pricing'),
                    yearlyPrice = $this.find('.yearly-pricing'),
                    buttonSlide = $this.find('.pricing-checkbox');

                monthlySelectBtn.on('click', function () {
                    buttonSlide.prop('checked', true);
                    $(this).addClass('active');
                    yearlySelectBtn.removeClass('active');
                    monthlyPrice.show();
                    yearlyPrice.hide();
                });

                yearlySelectBtn.on('click', function () {
                    buttonSlide.prop('checked', false);
                    $(this).addClass('active');
                    monthlySelectBtn.removeClass('active');
                    monthlyPrice.hide();
                    yearlyPrice.show();
                });

                buttonSlide.on('change', function () {
                    if (buttonSlide.is(':checked')) {
                        monthlySelectBtn.addClass('active');
                        yearlySelectBtn.removeClass('active');
                        monthlyPrice.show();
                        yearlyPrice.hide();
                    } else {
                        yearlySelectBtn.addClass('active');
                        monthlySelectBtn.removeClass('active');
                        monthlyPrice.hide();
                        yearlyPrice.show();
                    }
                });
            });
        },

        isotopeActivation: function name(params) {
            $('.isotop-demo-mesonry-activation, .rbt-custom-page-meso-active, .splash-demo-mesonry-activation').each(function () {
                var $container = $(this);
                var $grid = $container.find('.grid-3-meso, .grid-2-meso, .grid-4-meso, .grid-5-meso, .grid-8-meso');

                if (!$grid.length) return;

                var instance = $grid.isotope({
                    itemSelector: '.rbt-meso-item',
                    layoutMode: 'masonry'
                });
                $container.data('isotopeGrid', instance);

                // Prevent overlap while images are still loading.
                $grid.imagesLoaded()
                    .progress(function () {
                        instance.isotope('layout');
                    })
                    .always(function () {
                        instance.isotope('layout');
                    });

                $container.find('.rbt-tab-btn-list').on('click', 'button', function () {
                    var filterValue = $(this).attr('data-filter');
                    $(this).siblings('.active').removeClass('active');
                    $(this).addClass('active');

                    var $gridInstance = $container.data('isotopeGrid');
                    if ($gridInstance) {
                        $gridInstance.isotope({ filter: filterValue });
                    }
                });
            });

            $('.modal').on('shown.bs.modal', function () {
                $('.isotop-demo-mesonry-activation, .rbt-custom-page-meso-active, .splash-demo-mesonry-activation').each(function () {
                    var $gridInstance = $(this).data('isotopeGrid');
                    if ($gridInstance) {
                        $gridInstance.isotope('layout');
                    }
                });
            });

            $('.rbt-layout').each(function () {
                var $layoutGrid = $(this);
                var layoutInstance = $layoutGrid.isotope({
                    itemSelector: '.rbt-layout-item',
                    percentPosition: true,
                    horizontalOrder: true,
                    masonry: {
                        columnWidth: '.rbt-layout-item',
                    }
                });

                $layoutGrid.imagesLoaded()
                    .progress(function () {
                        layoutInstance.isotope('layout');
                    })
                    .always(function () {
                        layoutInstance.isotope('layout');
                    });
            });
        },

        progressCount: function () {
            $('.rbt-modern-progress-bar').each(function () {
                var $this = $(this);
                var percent = $this.data('percent');
                if (typeof percent !== 'undefined' && !isNaN(percent)) {
                    percent = percent / 100;
                    $this.waypoint(function (direction) {
                        if (direction === 'down') {
                            try {
                                var bar = new ProgressBar.Circle(this.element, {
                                    color: '#24BD25',
                                    strokeWidth: 16,
                                    duration: 800,
                                    from: { color: '#24BD25', width: 4 },
                                    to: { color: '#24BD25', width: 4 },
                                    step: function (state, circle) {
                                        circle.path.setAttribute('stroke', state.color);
                                        circle.path.setAttribute('stroke-width', state.width);

                                        var value = Math.round(circle.value() * 100);
                                        if (value === 0) {
                                            circle.setText('');
                                        } else {
                                            circle.setText(value + '%');
                                        }
                                    }
                                });

                                bar.animate(percent);
                            } catch (e) {
                                console.error('Error initializing ProgressBar:', e);
                            }
                            this.destroy();
                        }
                    }, {
                        offset: '75%'
                    });
                } else {
                    console.warn('Progress bar element missing percent data or invalid percent value.');
                }
            });
        },

        openSocialShare: function () {
            const shareBtn = document.querySelector('.rbt-share-btn');
            const shareOptions = document.querySelector('.rbt-social-share-box');

            if (shareBtn) {
                $('.rbt-share-btn').click(function () {
                    shareOptions.classList.add('show-share-option')
                })
                $('.close-social-share').click(function () {
                    shareOptions.classList.remove('show-share-option')
                })
            }
        },

        remainingPopup: function () {
            const remainingPop = document.querySelector('.rbt-remaining-popup');
            if (remainingPop) {
                setTimeout(() => {
                    remainingPop.classList.add('isVisible');
                }, 2000);

                $('.close-remaining-popup').click(function () {
                    remainingPop.classList.remove('isVisible');
                })
            }
        },

        cookieAlert: function () {
            const cookies = document.querySelector('.rbt-cookies');

            if (cookies && !localStorage.getItem('displayed_cookie_alert')) {
                setTimeout(() => {
                    cookies.classList.add('isVisible');
                }, 2000);

                $('.rbt-cookies-decline-btn, .rbt-cookies-accept-btn, .rbt-close-btn').click(function () {
                    cookies.classList.remove('isVisible');
                    localStorage.setItem('displayed_cookie_alert', true);
                });
            }
        },

        moveAnimation: function () {
            $('.scene').each(function () {
                new Parallax($(this)[0]);
            });
        },

        dropdownActivation: function () {
            $('.rbt-dropdown-menu-elastic .has-child-menu > a').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $('.rbt-dropdown-menu-elastic .has-child-menu').not($(this).parent()).removeClass('active');
                $(this).parent().toggleClass('active');
            });
            $(document).on('click', function () {
                $('.rbt-dropdown-menu-elastic .has-child-menu').removeClass('active');
            });
        },

        welcomeBanner: function () {
            $(document).ready(function () {
                if (Boolean(localStorage.getItem('displayed_stockout_modal')) !== true) {
                    $('#welcomebannerModal').modal('show');
                    localStorage.setItem('displayed_stockout_modal', true);
                }
            });

            $(".rbt-modal-dis-btn").on("click", function () {
                $(this).blur();
            })
        },

        // color animation
        colorAnimation: function () {
            let bottomBar = $('.rbt-demo-filter-bottom-bar');
            let colorWrapper = $('.rbt-color-animation-active');
            let tl;
            if (bottomBar.length) {
                gsap.set(bottomBar, { scale: 1.05, opacity: 0, stagger: 0.2 });
                gsap.timeline({
                    scrollTrigger: {
                        trigger: '.rbt-demo-filter-bottom-bar',
                        scroller: 'body',
                        start: 'top 100%',
                        end: 'top 60%',
                        scrub: true
                    }
                }).to(bottomBar, {
                    scale: 1,
                    duration: 2,
                    opacity: 1,
                    ease: 'power2.out'
                });
            }
            if (colorWrapper.length) {
                gsap.set(colorWrapper, { x: 0, y: 0, stagger: 0.2 });
                tl = gsap.timeline({
                    yoyo: true,
                    scrollTrigger: {
                        trigger: '.rbt-color-animation-card',
                        scroller: 'body',
                        start: 'top 50%',
                        end: 'top 0%',
                    }
                })
            }
            if (colorWrapper.length) {
                $('.rbt-color-animation-active .rbt-color-1').each(function () {
                    gsap.set($(this), {
                        x: 150,
                        scaleX: 0.5,
                    });
                    tl.to($(this), {
                        x: 0,
                        scaleX: 1,
                        duration: 1,
                    }, '+')
                });
                $('.rbt-color-animation-active .rbt-color-2').each(function () {
                    gsap.set($(this), {
                        y: -30,
                        scaleX: 0.5,
                    });
                    tl.to($(this), {
                        y: 0,
                        scaleX: 1,
                        duration: 1,
                    }, '+')
                });
                $('.rbt-color-animation-active .rbt-color-3').each(function () {
                    gsap.set($(this), {
                        x: -100,
                        y: 30,
                        scaleX: 0.5,
                    });
                    tl.to($(this), {
                        x: 0,
                        y: 0,
                        scaleX: 1,
                        duration: 1,
                    }, '+')
                });
                $('.rbt-color-animation-active .rbt-color-4').each(function () {
                    gsap.set($(this), {
                        x: -150,
                        scaleX: 0.5,
                    });
                    tl.to($(this), {
                        x: 0,
                        scaleX: 1,
                        duration: 1,
                    }, '+')
                });
            }
        },

        defaultFormValidation: function () {
            (() => {
                const forms = document.querySelectorAll('.needs-validation')
                Array.from(forms).forEach(form => {
                    form.addEventListener('submit', event => {
                        if (!form.checkValidity()) {
                            event.preventDefault()
                            event.stopPropagation()
                        }
                        form.classList.add('was-validated')
                    }, false)
                })
            })()
        },

        // popovers
        popoverActivation: function () {
            const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
            const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
        },

        // bootstrap toast active
        toastActive: function () {
            const toastTrigger = document.getElementById('liveToastBtn')
            const toastLiveExample = document.getElementById('liveToast')

            if (toastTrigger) {
                const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
                toastTrigger.addEventListener('click', () => {
                    toastBootstrap.show()
                })
            }
        },

        // handle load more demos
        loadMoreDemos: function () {
            $('.rbt-has-load-more-element').each(function () {
                const $container = $(this);
                const $elements = $container.find('.rbt-load-single-element');
                const $loadMoreBtn = $container.find('.rbt-load-more-element-btn');
                const $nothingFound = $('.rbt-nothing-found');
                const demoPerLoading = parseInt($container.attr('data-element-per-load')) || 16;
                let currentPage = 0;
                let isSearching = false;

                function showMoreDemos() {
                    if (isSearching) return;
                    const start = currentPage * demoPerLoading;
                    const end = start + demoPerLoading;
                    $elements.slice(start, end).addClass('visible');
                    currentPage++;
                    if (currentPage * demoPerLoading >= $elements.length) {
                        $loadMoreBtn.hide();
                    }
                    $(document).trigger('renderIsotopeAgainAfterLoad');
                }
                showMoreDemos();
                $loadMoreBtn.on('click', showMoreDemos);

                const filterBtn = $container.find('.rbt-filter-btn');
                filterBtn.on('click', function () {
                    let filterValue = $(this).attr('data-filter');
                    if (filterValue === '*') {
                        $elements.addClass('rbt-load-single-element');
                        if (!isSearching) $loadMoreBtn.removeClass('d-none');
                    } else {
                        $elements.removeClass('rbt-load-single-element');
                        $loadMoreBtn.addClass('d-none');
                    }
                });

                // Handle search functionality
                $('.rbt-demo-search-active').each(function () {
                    let searchContainer = $(this);
                    let searchField = searchContainer.find('#rbt-demo-search-field');
                    searchField.attr('autocomplete', 'off');
                    let filterBtn = $('.rbt-tab-btn-list button');
                    searchField.on('input', function () {
                        let searchVal = searchField.val().trim().toLowerCase();
                        isSearching = searchVal.length > 0;
                        handleDemoSearch(searchVal);
                    });

                    function handleDemoSearch(searchVal) {
                        if (searchVal.length > 0) {
                            $loadMoreBtn.addClass('d-none');
                            $elements.removeClass('rbt-load-single-element');
                        } else {
                            $loadMoreBtn.removeClass('d-none');
                            $elements.addClass('rbt-load-single-element');
                        }
                        let matchCount = 0;
                        $('.splash-demo-mesonry-activation').each(function () {
                            let $container = $(this);
                            let $gridInstance = $container.data('isotopeGrid');
                            if (!$gridInstance) return;
                            $gridInstance.isotope({
                                filter: function () {
                                    let demoTitle = $(this).find('.rbt-title').text().toLowerCase();
                                    let isMatch = demoTitle.includes(searchVal);
                                    if (isMatch) matchCount++;
                                    return isMatch;
                                }
                            });
                        });

                        // Show/Hide 'Nothing Found' message
                        if (matchCount === 0) {
                            $nothingFound.show();
                        } else {
                            $nothingFound.hide();
                        }
                    }

                    // Handle clearing search field when clicking filter buttons
                    filterBtn.on('click', function () {
                        searchField.val('');
                        isSearching = false;
                        let filterValue = $(this).attr('data-filter');
                        $(this).siblings('.active').removeClass('active');
                        $(this).addClass('active');
                        $('.splash-demo-mesonry-activation').each(function () {
                            let $container = $(this);
                            let $gridInstance = $container.data('isotopeGrid');
                            if (!$gridInstance) return;
                            $gridInstance.isotope({ filter: filterValue });
                        });
                        $nothingFound.hide();
                        if (filterValue === '*') {
                            $loadMoreBtn.removeClass('d-none');
                        }
                    });
                });
            });
        },

        datepickerActivation: function () {
            $('.rbt-date-picker-activation').datepicker();
            $('.rbt-expiry-date').datepicker({
                format: "mm/yy",
                startView: "months",
                minViewMode: "months",
                autoclose: true
            });
        },

        tabActivationWithNavigation: function () {
            let currentLocation = document.location.href;
            let tabs = $('.rbt-filter-btn');

            tabs.each(function () {
                let currentTab = $(this);
                let currentTabId = currentTab.attr('id');
                if (currentLocation.includes(currentTabId)) {
                    currentTab.siblings().removeClass('active');
                    currentTab.addClass('active');
                    $(document).trigger('tabActiveHighlight')
                }
            })
        },

        sidenavActivation: function () {
            let currentLocation = document.location.href;
            let navItems = $('.rbt-sidebar-nav-list a');

            navItems.each(function () {
                let currentNav = $(this);
                if (!currentLocation.includes(currentNav.attr('href'))) {
                    currentNav.removeClass('active');
                } else {
                    currentNav.addClass('active');
                }
            })
        },

        // handle input pattern
        rbtInputPattern: function () {
            let cardNumberInputField = $('.rbt-credit-card-input');
            let dateInputField = $('.rbt-expiration-date');
            let cvvInputField = $('.rbt-cvv-input');

            // handle credit card number input pattern
            cardNumberInputField.each(function () {
                let $this = $(this);
                $this.on('input', function () {
                    let value = $(this).val().replace(/\D/g, '');
                    value = value.replace(/(.{4})/g, '$1 ').trim();
                    $(this).val(value);
                });
            });

            // handle date input pattern
            dateInputField.each(function () {
                let $this = $(this);
                $this.on('input', function () {
                    let value = $(this).val().replace(/\D/g, '');
                    if (value.length > 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    $(this).val(value);
                });
            });

            // handle cvv input pattern
            cvvInputField.each(function () {
                let $this = $(this);
                $this.on('input', function () {
                    let value = $(this).val().replace(/\D/g, '');
                    $(this).val(value.substring(0, 4));
                });
            })
        },

        // handle search product color
        handleSearchFilterOptions: function () {
            let $searchField = $('.rbt-filter-search-field');
            let $nothingFound = $('.rbt-filter-item-not-found');

            $searchField.each(function () {
                let $this = $(this);
                $this.on('input', function () {
                    let $searchVal = $this.val().toLowerCase();
                    let $singleColor = $('.rbt-search-filter-item-list .rbt-color-swatch-group .rbt-color-swatch-text');

                    $singleColor.each(function () {
                        let $colorValue = $(this).text().toLowerCase();

                        if (!$colorValue.includes($searchVal)) {
                            $(this).closest('.rbt-color-swatch-group').hide();
                        } else {
                            $(this).closest('.rbt-color-swatch-group').show();
                        }

                        if ($searchVal) {
                            $(this).closest('.rbt-has-show-more').find('.rbt-show-more-btn-area').hide();
                        } else {
                            $(this).closest('.rbt-has-show-more').find('.rbt-show-more-btn-area').show();
                        }
                    });
                    let visibleCount = $('.rbt-color-swatch-group:visible').length;

                    if (!visibleCount) {
                        $nothingFound.each(function () {
                            $(this).show();
                        })
                    } else {
                        $nothingFound.each(function () {
                            $(this).hide();
                        })
                    }
                });
            });
        },

        // Dynamic form submission
        contactForm: function () {
            function appendFormMessage($form, messageClass, messageText, prefix) {
                var $message = $('<div>', {
                    class: messageClass
                });

                $('<p>').text((prefix || '') + String(messageText || '')).appendTo($message);
                $form.find('.rainbow-btn').after($message);
            }

            $('.rainbow-dynamic-form').on('submit', function (e) {
                e.preventDefault();
                var _self = $(this);
                var __selector = _self.closest('input,textarea');
                _self.closest('div').find('input,textarea').removeAttr('style');
                _self.find('.error-msg').remove();
                _self.closest('div').find('button[type="submit"]').attr('disabled', 'disabled');
                var data = $(this).serialize();
                $.ajax({
                    url: 'mail.php',
                    type: "post",
                    dataType: 'json',
                    data: data,
                    success: function (data) {
                        _self.closest('div').find('button[type="submit"]').removeAttr('disabled');
                        if (data.code == false) {
                            _self.closest('div').find('[name="' + data.field + '"]');
                            appendFormMessage(_self, 'error-msg', data.err, '*');
                        } else {
                            $('.error-msg').hide();
                            $('.form-group').removeClass('focused');
                            appendFormMessage(_self, 'success-msg', data.success);
                            _self.closest('div').find('input,textarea').val('');

                            setTimeout(function () {
                                $('.success-msg').fadeOut('slow');
                            }, 5000);
                        }
                    }
                });
            });
        },

        scrollDownActivation: function () {
            $('.rbt-scroll-down-btn').on('click', function () {
                $('html, body').animate({
                    scrollTop: $(window).height() / 2
                }, 800);
            });
        },

        copyrightYear: function () {
            $('.copyright-year').text(new Date().getFullYear());
        },
    }
    $(window).ready(() => {
        rbtJs.i();
    })
})(window, document, jQuery);

};