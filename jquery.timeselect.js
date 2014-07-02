/**
 * jQuery TimeSelect plugin
 * @author Saurabh aka Jsx <saurabh@rebugged.com>
 * @version 1.0
 *
 * jQuery UI autocomplete is required for this plugin to work.
 */
(function ($) {
    'use strict';
    var hrs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    var now = new Date();
    var period = '';
    var antiPeriod = '';

    if (now.getHours() > 12) {
        period = 'pm';
        antiPeriod = 'am';
    } else {
        period = 'am';
        antiPeriod = 'pm';
    }

    function makeTimeWithThisHour(hr) {
        var times = [];

        for (var m in this.mins) {
            var thisTime = makeTimeString(hr, this.mins[m], period);
            times.push(thisTime);
        }

        return times;
    }

    function makeTimeWithThisMin(min) {
        var times = [];

        for (var h in hrs) {
            var thisTime = makeTimeString(hrs[h], min, period);
            times.push(thisTime);
        }

        return times;
    }

    function makeTimeWithHourAndMin(hr, min, givenPeriod) {
        var times = [];
        var candidateMins = [];

        if (givenPeriod) {
            if ('am'.match(givenPeriod, 'i')) {
                period = 'am';
            } else if ('pm'.match(givenPeriod, 'i')) {
                period = 'pm';
            }
        }

        if (this.mins.indexOf(min) == -1) {
            for (var m in this.mins) {
                if (String(this.mins[m]).match(min)) {
                    candidateMins.push(this.mins[m]);
                    times.push(makeTimeString(hr, this.mins[m], period));
                }
            }

            if (!givenPeriod) {
                for (var c in candidateMins) {
                    times.push(makeTimeString(hr, candidateMins[c], antiPeriod));
                }
            }
        } else {
            times.push(makeTimeString(hr, min, period));
            times.push(makeTimeString(hr, min, antiPeriod));
        }

        return times;
    }

    function makeTimeString(hr, min, period) {
        hr = Number(hr);
        min = Number(min);

        hr = hr > 12 ? hr - 12 : hr;
        hr = hr < 10 ? '0' + hr : String(hr);
        min = min < 10 ? '0' + min : String(min);
        return hr + ':' + min + ' ' + period;
    }

    $.fn.timeSelect = function (options) {
        this.each(function () {
            var element = $(this),
                mins = [];

            var settings = {
                minsInterval: 5,
                maxResults: 0,
                success: function () {},
                error: function () {}
            };

            if (options) {
                $.extend(settings, options);
            }

            for (var i = 0; i < 60; i+= settings.minsInterval) {
                mins.push(i);
            }

            element.autocomplete({
                source: function (request, response) {
                    var responseData = [];
                    var chunks = request.term.split(/[: -]+/);
                    for (var c in chunks) {
                        if (!chunks[c]) {
                            chunks.splice(c, 1);
                        }
                    }

                    if (chunks.length === 3) {
                        // chunks[0] = hr
                        // chunks[1] = min
                        // chunks[2] = period (am/pm)
                        if (chunks[0] < 25 && chunks[1] < 60) {
                            responseData = makeTimeWithHourAndMin.call({mins: mins}, chunks[0], chunks[1], chunks[2]);
                        }

                    } else if (chunks.length === 2) {
                        // chunks[0] = hr
                        // chunks[1] = min
                        if (chunks[0] < 25 && chunks[1] < 60) {
                            responseData = makeTimeWithHourAndMin.call({mins: mins}, chunks[0], chunks[1]);
                        }
                    } else {
                        // chunks[0] could be hr || min
                        var time = Number(chunks[0]);
                        if (time) {
                            if (time > 24) {
                                // given is min, so lets give back all the hrs with this min
                                if (mins.indexOf(time) > -1) {
                                    responseData = makeTimeWithThisMin(time);
                                }
                            } else {
                                responseData = makeTimeWithThisHour.call({mins: mins}, time);
                            }
                        } else {
                            responseData = [];
                        }
                    }

                    if (Number(settings.maxResults)) {
                        responseData.splice(settings.maxResults, responseData.length - settings.maxResults);
                    }

                    response(responseData);
                },

                change: function (event, ui) {
                    var selectionStatus = true,
                        selectedTime = element.val(),
                        selectedTimeChunks = selectedTime.split(/[: -]+/);

                    if (selectedTimeChunks.length != 3) {
                        selectionStatus = false;
                    } else if (hrs.indexOf(Number(selectedTimeChunks[0])) === -1) {
                        selectionStatus = false;
                    } else if (mins.indexOf(Number(selectedTimeChunks[1])) === -1) {
                        selectionStatus = false;
                    } else if (!selectedTimeChunks[2]) {
                        selectionStatus = false;
                    } else if (selectedTimeChunks[2].toLowerCase() != 'am' && selectedTimeChunks[2].toLowerCase() != 'pm') {
                        selectionStatus = false;
                    }

                    if (selectionStatus) {
                        if (typeof settings.success === 'function') {
                            settings.success(element, selectedTime);
                        }
                    } else {
                        if (typeof settings.error === 'function') {
                            settings.error(element, selectedTime);
                        }
                    }
                }
            });
        });

        // Let's make this chainable
        return this;
    };
})(jQuery);