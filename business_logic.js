
var data = {
    labels: ['3 Feb', 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    series: [
        [5, 5, 10, 8, 7, 5, 4, null, null, null, 10, 10, 7, 8, 6, 9, null, null, 8, 5, 6, 10,  11, 11, 11],
        [10, 15, null, 12, null, 10, 12, 15, null, null, 12, null, 14, null, null, null, 15, 15, 16, 17, null, null, 18, 19, 20],
        [null, null, null, null, 3, 4, 1, 3, 4,  6,  7,  9, 5, null, null, null, null, 6, 6, 5, 4, 5, 4, null, 8],
        [null, 15, null, 13, 17, 11, 12, 11, null, null, null, 17, 17, null, null, null, 18, 19, 20, 21, 22, 22, 21, 20, null]
    ]
}
normalizeData(data, 20);


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
    result[result.length - 1] = allItems[allItems.length - 1]
    return result;
}

// Function to normalize the data var to a limited size
function normalizeData(data, size) {
    data.labels = evenlyPickItemsFromArray(data.labels, size);
    for (i = 0; i < data.series.length; i++) {
        data.series[i] = evenlyPickItemsFromArray(data.series[i], size);
    }
}

// Function to calculate the 1 rep max based on weight and reps
function calc_max(weight, reps) {
    // Brzycki
    if (reps < 10) {
      var max = weight * (36 / (37-reps)); // will work for actual 1RM
    } else {
    // Eply
      var max = weight * (1 + (reps / 30));
    }
    return max;
  }



        var options = {
    			fullWidth: true,
    			chartPadding: {
    				right:30
    			},
    			plugins: [
    		        Chartist.plugins.legend({
    		            legendNames: ['Bench Press', 'Squat', 'Shoulder Press', 'Weight'],
    		        })
    		    ],
    			lineSmooth: Chartist.Interpolation.cardinal({
    				fillHoles: true,
    			}),
    			low: 0
    		}


        var chart = new Chartist.Line('#chart', data, options);


        


        

        function csvJSON(csv) {
          var lines=csv.split("\n");
          var result = [];
          var headers=lines[0].split(",");
          for(var i=1;i<lines.length;i++){
              var obj = {};
              var currentline=lines[i].split(",");
              for(var j=0;j<headers.length;j++){
                  obj[headers[j]] = currentline[j];
              }
              result.push(obj);
          }
          return result;
        }

        function tableToJson(table) {
          // this is not intuitive, there are extra header rows and crap
          var data = [];
          var headers = [];
          //first th row in table we don't need
          for (var i=1; i<table.rows[1].cells.length; i++) {
            header = table.rows[1].cells[i].innerText;
            headers.push(header);
          }
          // first th useless row, second row is headers, start third row
          for (var i=2; i<table.rows.length; i++) {
            var tableRow = table.rows[i];
            var rowData = {};
            for (var j=1; j<tableRow.cells.length; j++) {
              //these rows have the useless row number as an entry to offset by 1
              rowData[ headers[j-1] ] = tableRow.cells[j].innerText;
            } 
            data.push(rowData);
          }
          return data; 
        }

        // use a cors header proxy and get the csv i published
        const proxyurl = "https://cors-anywhere.herokuapp.com/";
        const proxyurl2 = "https://api.allorigins.win/get?url=";
        const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSgea157RpJMjcWTrTX_nanhQ0dtVBaXvehQmxYojLgRoUMV_hQZ5JfVrTdCcCT520kSTTh891Q89YD/pub?gid=719380801&single=true&output=csv"; 
        
        // site that doesn’t send Access-Control-*
        fetch(proxyurl2 + url) // https://cors-anywhere.herokuapp.com/https://example.com
        .then(response => response.text())
        .then(
          function(contents) {
            // this is where we do everything
            
            // two diff ways of cors avoidance
            // proxyurl and csvJSON = cors-anywhere
            // proxyurl2 and tableToJson = allorigins
            var parser = new DOMParser();
            cont = tableToJson(parser.parseFromString(contents, "text/html").getElementsByTagName("table")[0])
            //var cont = csvJSON(contents);

            console.log(cont);
            bw = cont[cont.length - 1].BodyWeight
            console.log(typeof(bw))
            console.log(bw)
            document.getElementById("bodyweight").innerText = bw;

            var benchpresses = []
            var shoulderpresses = []
            var squats = []
            // yup now modify this to collect all the stuff at the end
            // how do i track it, calulated max or performed max
            // need to decide
            for (entry of cont) {
              if (entry.Exercise === "Bench Press"){
                benchpresses.push(entry);
              }
              else if (entry.Exercise === "Overhead Press"){
                shoulderpresses.push(entry)
              }
              else if (entry.Exercise === "Squat"){
                squats.push(entry)
              }
            }


            // map each bench to the calculated max and take the projected or actual max
            var max_bench = Math.max(...benchpresses.map(function (bp) {return calc_max(parseFloat(bp.Weight), parseFloat(bp.Reps))}));
            document.getElementById("benchpress").innerText = String(Math.floor(max_bench));

            var max_squat = Math.max(...squats.map(function (sq) {return calc_max(parseFloat(sq.Weight), parseFloat(sq.Reps))}));
            document.getElementById("squat").innerText = String(Math.floor(max_squat));

            var max_shoulder = Math.max(...shoulderpresses.map(function (sh) {return calc_max(parseFloat(sh.Weight), parseFloat(sh.Reps))}));
            document.getElementById("shoulderpress").innerText = String(Math.floor(max_shoulder));



            arr = cont;
            arr.sort((a, b) => new Date(a.date) - new Date(b.date))
            // use this to sort from oldest to newest dates

            dates_and_maxes = []

            curr_bench_max = null
            curr_squat_max = null
            curr_shoulder_max = null

            curr_obj  = {}
            console.log(arr[0])
            curr_date = arr[0]['Start Date (UTC)']
            curr_obj.bodyweight = arr[0]['BodyWeight']
            curr_obj.date = arr[0]['Start Date (UTC)']
            curr_obj.bench_max = curr_bench_max
            curr_obj.squat_max = curr_squat_max
            curr_obj.shoulder_max = curr_shoulder_max

            for (elem of arr){
              //if we're on the same date
              //cycle through and update maxes
              if (elem['Start Date (UTC)'] === curr_date) {
                if (elem.Exercise === "Bench Press"){
                  if (calc_max(elem.Weight, elem.Reps) > curr_obj.bench_max){
                    curr_obj.bench_max = calc_max(elem.Weight, elem.Reps)

                  }
                }
                if (elem.Exercise === "Squat"){
                  if (calc_max(elem.Weight, elem.Reps) > curr_obj.squat_max){
                    curr_obj.squat_max = calc_max(elem.Weight, elem.Reps)
                  }
                }
                if (elem.Exercise === "Overhead Press"){
                  if (calc_max(elem.Weight, elem.Reps) > curr_obj.shoulder_max){
                    curr_obj.shoulder_max = calc_max(elem.Weight, elem.Reps)
                  }
                }
              } 
              //if we've arrived at a new date, reset
              else {
                dates_and_maxes.push(curr_obj)
                curr_date = elem['Start Date (UTC)']
                curr_obj  = {}
                curr_obj.date = curr_date
                curr_obj.bodyweight = elem.BodyWeight
                curr_obj.bench_max = null
                curr_obj.squat_max = null
                curr_obj.shoulder_max = null
                if (elem.Exercise === "Bench Press"){
                  curr_obj.bench_max = calc_max(elem.Weight, elem.Reps)
                }
                else if (elem.Exercise === "Squat"){
                  curr_obj.squat_max = calc_max(elem.Weight, elem.Reps)
                }
                else if (elem.Exercise === "Overhead Press"){
                  curr_obj.squat_max = calc_max(elem.Weight, elem.Reps)
                }
              }
            }
            //at end append last one too
            dates_and_maxes.push(curr_obj)
            console.log(dates_and_maxes)
          }

        )
        

        /*now i gotta manipulate cont and graph right*/

        /*
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
        } --handle this /r thing
        */


        /* ANIMATION SECTION */
        var seq = 0,
    		delays = 2,
    		durations = 300;

    		// Once the chart is fully created we reset the sequence
    		chart.on('created', function() {
    			seq = 0;
    		});

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
    			    var pos1Animation = {
    					begin: seq * delays,
    					dur: durations,
    					from: data[data.axis.units.pos + '1'] - 30,
    					to: data[data.axis.units.pos + '1'],
    					easing: 'easeOutQuart'
        			};

        			var pos2Animation = {
    					begin: seq * delays,
    					dur: durations,
    					from: data[data.axis.units.pos + '2'] - 100,
    					to: data[data.axis.units.pos + '2'],
    					easing: 'easeOutQuart'
        			};

        			var animations = {};
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
        // screen resize and sometimes scrolling. so we remove the listeners on the chart and leave it in its final state
        // we do this after the drawing has finished so set a 3 second timeout before removing drawing abilities
        // might have to be longer (in case the cors herokuapp takes forever)
        setTimeout(function(){ chart.off('created'); chart.off('draw');}, 3000);


        // tweak timing, tweak the set timeout
        // add time series to the graph
        // make sure the 20 data point thing works (i remember it working i think?)