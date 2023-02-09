/* UTILITIES */

// Turn an array into a shorter evenly spaced array with n elements
// eg, an array of [0..49], choose 20 will be:
// [1, 3, 6, 8, 11, 13, 16, 18, 21, 23, 26, 28, 31, 33, 36, 38, 41, 43, 46, 48]
// we'd rather have 49 than 48 to know most recent (likely new best) so sub last item
function evenlyPickItemsFromArray(allItems, neededCount) {
    // if we want more items than avaliable, return all items
    if (neededCount >= allItems.length) {
        return [...allItems];
    }
    // buffer for collecting picked items
    const result = [];
    const totalItems = allItems.length;
    // default interval between items (might be float)
    const interval = totalItems/neededCount;

    for (let i = 0; i < neededCount; i++) {
        // always add half of interval, so 'picking area' is 'aligned' to the center
        // eg evenlyPickItemsFromArray([0...100], 1); // [50] instead of [0]
        const evenIndex = Math.floor(i * interval + interval / 2);
        result.push(allItems[evenIndex]);
    }

    // adjust the last one (if its the same already, oh well)
    result[result.length - 1] = allItems[allItems.length - 1];
    return result;
}

// Function to normalize the data var to a limited number of data points
// Also only show every other date to not crowd
function normalizeData(data, size) {
    // modify the labels to be of length 'size'
    data.labels = evenlyPickItemsFromArray(data.labels, size);
    // modify each series (exercise) to be of length 'size'
    for (let i = 0; i < data.series.length; i++) {
        data.series[i] = evenlyPickItemsFromArray(data.series[i], size);
    }
    // get rid of every other date so they don't crowd each other in presentation
    for (let i = 0; i < size; i+=2) {
        data.labels[i] = "";
    }
    /*
    // commenting this out since no space for the year in the text. maybe replace the december with the new year
    // we want to call out what year it is when we cycle from the end of one to the beginning of the next
    const months = "JanFebMarAprMayJunJulAugSepOctNovDec";
    newYear = 2022;
    for (let i = 2; i < size; i++) {
        if (months.indexOf(data.labels[i].split(' ')[0]) < months.indexOf(data.labels[i-2].split(' ')[0])) {
        	data.labels[i-1] = newYear.toString();
        	newYear++;
        }
    }
    */
}

// Function to calculate the 1 rep max based on weight and reps
function calc_max(weight, reps) {
    let max;
    // Brzycki
    if (reps < 10) {
      max = weight * (36 / (37-reps)); // will work for actual 1RM
    } else {
    // Eply
      max = weight * (1 + (reps / 30));
    }
    return max;
}

// Map the max function over an array
function get_max_overall(exercise) {
    const max_overall = Math.max(...exercise.map(function (elem) {return calc_max(parseFloat(elem.Weight), parseFloat(elem.Reps))}));
    return String(Math.floor(max_overall));
}

/*
Format of csv/table to json looks like this:
{
    "Name":"Upper Body Power",
    "Start Date (UTC)":"10/24/2020",
    "Start Time (UTC)":"4:14:00 PM",
    "End Date (UTC)":"10/24/2020",
    "End Time (UTC)":"5:14:00 PM",
    "BodyWeight":"162",
    "Exercise":"Bench Press",
    "Equipment":"Machine",
    "Reps":"10",
    "Weight":"125",
    "Time":"",
    "Distance":"",
    "Status":"Done",
    "Categories\r":"Pectorals\r"
}
*/

// Function to convert CSV to JSON when CORS returns raw CSV
function csvJSON(csv) {
    let lines = csv.split("\n");
    let result = [];
    let headers = lines[0].split(",");
    for(let i = 1; i < lines.length; i++) {
        let obj = {};
        let currentline = lines[i].split(",");
        for(let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }
        result.push(obj);
    }
    return result;
}

// Function to convert HTML Google Sheets Spreadsheet to JSON when CORS doesn't return raw CSV
function tableToJson(table) {
    // this is not intuitive, there are extra header rows and crap
    let data = [];
    let headers = [];

    // first th row in table we don't need
    for (let i = 1; i < table.rows[1].cells.length; i++) {
        header = table.rows[1].cells[i].innerText;
        headers.push(header);
    }

    // first th useless row, second row is headers, start third row
    for (let i = 2; i < table.rows.length; i++) {
        let tableRow = table.rows[i];
        let rowData = {};
        for (let j = 1; j < tableRow.cells.length; j++) {
            // these rows have the useless row number as an entry to offset by 1
            rowData[headers[j-1]] = tableRow.cells[j].innerText;
        } 
        data.push(rowData);
    }
    return data; 
}

// After we generate an array of objects each representing a workout, convert to series a chartist graph understands
function objects_to_series(object_array) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    let labels = [];
    let bench = [];
    let squat = [];
    let shoulder_press = [];
    let pulldown = [];
    let weight = [];

    for (entry of object_array) {
        let dt = new Date(entry.date);
        labels.push(months[dt.getMonth()] + " " + dt.getDate().toString());
        bench.push(entry.bench_max);
        squat.push(entry.squat_max);
        shoulder_press.push(entry.shoulder_max);
        pulldown.push(entry.pulldown_max);
        weight.push(entry.bodyweight);
    }
    return {
        labels: labels,
        series: [bench, squat, shoulder_press, pulldown, weight]
    }
    // format of data
    /*
    dummy_data = {
        labels: ['3 Feb', 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
        series: [
            [5, 5, 10, 8, 7, 5, 4, null, null, null, 10, 10, 7, 8, 6, 9, null, null, 8, 5, 6, 10,  11, 11, 11],
            [10, 15, null, 12, null, 10, 12, 15, null, null, 12, null, 14, null, null, null, 15, 15, 16, 17, null, null, 18, 19, 20],
            [null, null, null, null, 3, 4, 1, 3, 4,  6,  7,  9, 5, null, null, null, null, 6, 6, 5, 4, 5, 4, null, 8],
            [null, 15, null, 13, 17, 11, 12, 11, null, null, null, 17, 17, null, null, null, 18, 19, 20, 21, 22, 22, 21, 20, null],
            [null, 15, null, 13, 17, 11, 12, 11, null, null, null, 17, 17, null, null, null, 18, 19, 20, 21, 22, 22, 21, 20, null]
        ]
    };
    */
}

function fill_in_gaps(objs_series) {

    for (let series_index = 0; series_index <  objs_series["series"].length; series_index++) {
        for (let i = 1; i < objs_series["series"][0].length; i++) {
            if (objs_series["series"][series_index][i] === null) {
                objs_series["series"][series_index][i] = objs_series["series"][series_index][i - 1]
            }
        }
    }
    
    return objs_series
}

/* END UTILITIES */

// Return a promise to fetch thearse csv data, parse the csv data and make graphable
function fetch_data() {
    // use a cors header proxy to get the google sheets csv
    const proxy = "https://corsproxy.io/?";
    // maybe more https://gist.github.com/jimmywarting/ac1be6ea0297c16c477e17f8fbe51347
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSgea157RpJMjcWTrTX_nanhQ0dtVBaXvehQmxYojLgRoUMV_hQZ5JfVrTdCcCT520kSTTh891Q89YD/pub?gid=719380801&single=true&output=csv"; 

    return fetch(proxy + url)
        .then(function(data) { 
            return data.text();
        }).then(function(contents) {
            // first parse the table into usable objects
            let parser = new DOMParser();
            // if the cors proxy returns html not actual csv use uncomment the line below

            //let cont = tableToJson(parser.parseFromString(contents, "text/html").getElementsByTagName("table")[0]);
            
            // if the cors returns an actual csv object not html use the method below
            let cont = csvJSON(contents);
            
            //console.log(cont);
            const bw = cont[cont.length - 1].BodyWeight;
            document.getElementById("bodyweight").innerText = bw;
            let benchpresses = [];
            let shoulderpresses = [];
            let squats = [];
            let pulldowns = [];
            for (entry of cont) {
                if (entry.Exercise === "Bench Press") {
                    benchpresses.push(entry);
                }
                else if (entry.Exercise === "Overhead Press") {
                    shoulderpresses.push(entry);
                }
                else if (entry.Exercise === "Squat") {
                    squats.push(entry);
                }
                else if (entry.Exercise === "Pulldown") {
                    pulldowns.push(entry);
                }
            }
            // map each bench to the calculated max and take the projected or actual max
            document.getElementById("benchpress").innerText = get_max_overall(benchpresses);
            document.getElementById("squat").innerText = get_max_overall(squats);
            document.getElementById("shoulderpress").innerText = get_max_overall(shoulderpresses);
            document.getElementById("pulldown").innerText = get_max_overall(pulldowns);


            let arr = cont;
            // sort from oldest to newest dates
            arr.sort((a, b) => new Date(a.date) - new Date(b.date));

            let dates_and_maxes = [];

            // Manually enter first element
            let curr_bench_max = null;
            let curr_squat_max = null;
            let curr_shoulder_max = null;
            let curr_pulldown_max = null;
            let curr_obj  = {};
            let curr_date = arr[0]['Start Date (UTC)'];
            curr_obj.bodyweight = parseFloat(arr[0]['BodyWeight']);
            curr_obj.date = arr[0]['Start Date (UTC)'];
            curr_obj.bench_max = curr_bench_max;
            curr_obj.squat_max = curr_squat_max;
            curr_obj.shoulder_max = curr_shoulder_max;
            curr_obj.pulldown_max = curr_pulldown_max;
            for (elem of arr) {
                // if we're on the same date
                // cycle through our sets and update maxes
                if (elem['Start Date (UTC)'] === curr_date) {
                    if (elem.Exercise === "Bench Press" && elem.Status == "Done") {
                        if (calc_max(elem.Weight, elem.Reps) > curr_obj.bench_max) {
                            curr_obj.bench_max = calc_max(elem.Weight, elem.Reps);
                        }
                    }
                    if (elem.Exercise === "Squat" && elem.Status == "Done") {
                        if (calc_max(elem.Weight, elem.Reps) > curr_obj.squat_max) {
                            curr_obj.squat_max = calc_max(elem.Weight, elem.Reps);
                        }
                    }
                    if (elem.Exercise === "Overhead Press" && elem.Status == "Done") {
                        if (calc_max(elem.Weight, elem.Reps) > curr_obj.shoulder_max) {
                            curr_obj.shoulder_max = calc_max(elem.Weight, elem.Reps);
                        }
                    }
                    if (elem.Exercise === "Pulldown" && elem.Status == "Done") {
                        if (calc_max(elem.Weight, elem.Reps) > curr_obj.pulldown_max) {
                            curr_obj.pulldown_max = calc_max(elem.Weight, elem.Reps);
                        }
                    }
                } else {
                    // if we've arrived at a new date, push yesterday and reset
                    dates_and_maxes.push(curr_obj);
                    curr_date = elem['Start Date (UTC)'];
                    curr_obj  = {};
                    curr_obj.date = curr_date;
                    curr_obj.bodyweight = parseFloat(elem.BodyWeight);
                    curr_obj.bench_max = null;
                    curr_obj.squat_max = null;
                    curr_obj.shoulder_max = null;
                    curr_obj.pulldown_max = null;
                    if (elem.Exercise === "Bench Press" && elem.Status == "Done") {
                        curr_obj.bench_max = calc_max(elem.Weight, elem.Reps);
                    } else if (elem.Exercise === "Squat" && elem.Status == "Done") {
                        curr_obj.squat_max = calc_max(elem.Weight, elem.Reps);
                    } else if (elem.Exercise === "Overhead Press" && elem.Status == "Done") {
                        curr_obj.squat_max = calc_max(elem.Weight, elem.Reps);
                    } else if (elem.Exercise === "Pulldown" && elem.Status == "Done") {
                        curr_obj.pulldown_max = calc_max(elem.Weight, elem.Reps);
                    }
                }
            }
            // don't forget to push the last day too
            dates_and_maxes.push(curr_obj);
            console.log("data parsed:");
            console.log(dates_and_maxes);
            console.log(objects_to_series(dates_and_maxes));

            return fill_in_gaps(objects_to_series(dates_and_maxes));
        })
}

/* ANIMATION SECTION */
async function chart_and_animate() {
    let options = {
        fullWidth: true,
        chartPadding: {
            right:30
        },
        plugins: [
            Chartist.plugins.legend({
                legendNames: ['Bench Press', 'Squat', 'Shoulder Press', 'Pulldown', 'Weight'],
            }),
            Chartist.plugins.tooltip({
                transformTooltipTextFnc: function(tooltip) {
                    return Math.round(tooltip);
                  }
            })
        ],
        lineSmooth: Chartist.Interpolation.cardinal({
            fillHoles: true,
        }),
        low: 75
    };

    var data = await fetch_data();
    normalizeData(data, 20);
    // do the graphing after we've awaited
    console.log("data being graphed:");
    console.log(data);
    let chart = new Chartist.Line('#chart', data, options);
    let seq = 0;
    let delays = 2;
    let durations = 300;
    // On each drawn element by Chartist we use the Chartist.Svg API to trigger SMIL animations
    chart.on('draw', function(data) {
        seq++;
        if(data.type === 'line') {
        // If the drawn element is a line we do a simple opacity fade in. This could also be achieved using CSS3 animations.
            data.element.animate({
                opacity: {
                    // The delay when we like to start the animation
                    begin: seq * delays,
                    // Duration of the animation
                    dur: durations,
                    // The value where the animation should start
                    from: 0,
                    // The value where it should end
                    to: 1
                }
            });
        } else if(data.type === 'label' && data.axis === 'x') {
            data.element.animate({
                y: {
                    begin: seq * delays,
                    dur: durations,
                    from: data.y + 100,
                    to: data.y,
                    // We can specify an easing function from Chartist.Svg.Easing
                    easing: 'easeOutQuart'
                }
            });
        } else if(data.type === 'label' && data.axis === 'y') {
            data.element.animate({
                x: {
                    begin: seq * delays,
                    dur: durations,
                    from: data.x - 100,
                    to: data.x,
                    easing: 'easeOutQuart'
                }
            });
        } else if(data.type === 'point') {
            data.element.animate({
                x1: {
                    begin: seq * delays,
                    dur: durations,
                    from: data.x - 10,
                    to: data.x,
                    easing: 'easeOutQuart'
                },
                x2: {
                    begin: seq * delays,
                    dur: durations,
                    from: data.x - 10,
                    to: data.x,
                    easing: 'easeOutQuart'
                },
                opacity: {
                    begin: seq * delays,
                    dur: durations,
                    from: 0,
                    to: 1,
                    easing: 'easeOutQuart'
                }
            });
        } else if(data.type === 'grid') {
            // Using data.axis we get x or y which we can use to construct our animation definition objects
            let pos1Animation = {
                begin: seq * delays,
                dur: durations,
                from: data[data.axis.units.pos + '1'] - 30,
                to: data[data.axis.units.pos + '1'],
                easing: 'easeOutQuart'
            };

            let pos2Animation = {
                begin: seq * delays,
                dur: durations,
                from: data[data.axis.units.pos + '2'] - 100,
                to: data[data.axis.units.pos + '2'],
                easing: 'easeOutQuart'
            };

            let animations = {};
            animations[data.axis.units.pos + '1'] = pos1Animation;
            animations[data.axis.units.pos + '2'] = pos2Animation;
            animations['opacity'] = {
                begin: seq * delays,
                dur: durations,
                from: 0,
                to: 1,
                easing: 'easeOutQuart'
            };

            data.element.animate(animations);
        }
    });
    // the problem with the created and draw event listeners is that they refresh and redraw the chart on every 
    // screen resize and scroll. so we remove the listeners on the chart and leave it in its final state
    // we do this after the drawing has finished so set a few second timeout before removing drawing abilities
    setTimeout(function() { chart.off('created'); chart.off('draw');}, 2500);
}

chart_and_animate();