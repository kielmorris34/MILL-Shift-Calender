"use strict";

function $(id) {
  return document.getElementById(id);
}

function checkStatus(response) { 
  if (response.status >= 200 && response.status < 300) { 
    return response.text();
  } else { 
    return Promise.reject(new Error(response.status + ": " + response.statusText)); 
  } 
} 

(function() {
  
  /* global fetch */
  let shiftMatrix = [];
  let occupyMatrix = [];
  let times = [];
  let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let currScroll = "#bottom"
  
  window.addEventListener("load", function() {
    initialize();
    getShifts();
    getWorkshops();
    // scroller
    $("scroller").addEventListener('click', function() {
      $("arrow").classList.toggle("flip"); // span
      setTimeout(swapLink, 600);
    });
    
  });
  
  function swapLink() {
      if (currScroll == "#bottom") {
        $("scroller").href = "index.html#title";
        currScroll = "#title";
      } else {
        $("scroller").href = "index.html#bottom";
        currScroll = "#bottom";
      }
  }
  
  function initialize() {
    let timeCol = document.createElement("div");
    timeCol.classList.add("col");
    timeCol.id = "time";
    let cell = document.createElement("div");
    cell.classList.add("cell");
    timeCol.appendChild(cell);
    for (let j = 8; j <= 11; j++) {
        timeCol.appendChild(addHour(j,"am"));
    }
    timeCol.appendChild(addHour(12,"pm"));
    for (let j = 1; j <= 11; j++) {
        timeCol.appendChild(addHour(j, "pm"));
    }
    $("flex-calender").appendChild(timeCol);
    for (let i = 0; i < 7; i++) {
        let col = document.createElement("div");
        col.classList.add("col");
        let p = document.createElement("p");
        p.innerHTML = days[i];
        let day = document.createElement("div");
        day.classList.add("cell");
        day.classList.add("days");
        day.appendChild(p);
        col.append(day);
        
        let matColArr = [];
        let occColArr = [];
        for (let j = 0; j < 16; j++) {
            let cell = document.createElement("div");
            cell.classList.add("cell");
            cell.id = times[j] + "-" + days[i].toLowerCase();
            
            matColArr[matColArr.length] = cell.id;
            occColArr[occColArr.length] = 0;
            
            col.appendChild(cell);
        }
        shiftMatrix[shiftMatrix.length] = matColArr;
        occupyMatrix[occupyMatrix.length] = occColArr;
        
        $("flex-calender").appendChild(col);
    }
  }
  
  function addHour(hour, m) {
      let cell = document.createElement("div");
      cell.classList.add("cell");
      let p = document.createElement("p");
      p.innerHTML = hour + ":00" + m;
      times[times.length] = p.innerHTML;
      cell.appendChild(p);
      return cell;
  }
  
  
  function addShift(tech, desc, day, start, end) {
    return addShift(tech, desc, day, start, end, false);
  }
  
  function addShift(tech, desc, day, start, end, dummy) {
    
      if (tech == null) {
        tech = "";
      }
      
      let h = 51; // must be the same as set in CSS width + border
      
      let sMin = parseInt(start.substring(start.indexOf(":") + 1));
      let offset = (sMin / 60.0) * h;
      let anchor = start.substring(0, start.indexOf(":")) + ":00" + start.substring(start.indexOf("m") - 1) + "-" + day.toLowerCase(); // of format "1:00pm-fri"
      
      let endBase = end.substring(0, end.indexOf(":")) + ":00" + end.substring(end.indexOf("m") - 1);
      let hours = times.indexOf(endBase) - times.indexOf(anchor.substring(0, anchor.indexOf("-")));
      
      if (!dummy) {
        let splitShifts = [];
        let splitSelf = false;
        if ($(anchor).children.length > 0) {
          splitSelf = true;
          splitShifts.push(anchor);
        }
        if (tech.includes("\\,")) {
          let otherTech = tech.substring(tech.indexOf("\\,") + 3);
          addShift(otherTech, desc, day, start, end);
          splitSelf = true;
          splitShifts.push(anchor);  //otherTech.replace(" ", "-") + day + "-" + start + "-" + end);           // CORRECT VERSION!!
          tech = tech.substring(0, tech.indexOf("\\,"));
        }
        for (let i = 1; i < hours; i++) {
          let slot = times[times.indexOf(anchor.substring(0, anchor.indexOf("-"))) + i] + "-" + day; // times below anchor
          let slotTime = slot.substring(0,slot.indexOf("-")); // w/out day
          if ($(slot).children.length > 0) { // if already occupied
            if (!splitSelf) {                // splitself if not already
              let dummy = addShift("", "", day, start, start, true);
              dummy.classList.add("dummy");
              dummy.innerHTML = anchor; // reference anchor
              splitSelf = true;
            }
            if (splitShifts.indexOf($(slot).children[0].innerHTML) == -1 && $(slot).children[0].classList.contains("dummy")) { // If it's a dummy and its root hasn't been split yet
              let otherAnc = $(slot).children[0].innerHTML; // refer to other root
              let otherTime = otherAnc.substring(0, otherAnc.indexOf("-")); // w/out day
              let otherDummy = addShift("", "", day, otherTime, otherTime, true); // split other with dummy
              otherDummy.classList.add("dummy");
              otherDummy.innerHTML = anchor;
              splitShifts.push(otherAnc); // add to splitShifts
            }
          } else {
            let dummy = addShift("", "", day, slotTime, slotTime, true);
            dummy.classList.add("dummy");
            dummy.innerHTML = anchor;
          }
          
        }
      }

      let eMin = parseInt(end.substring(end.indexOf(":") + 1));
      let size = h * hours - offset + ((eMin / 60.0) * h);
      
      let shift = document.createElement("div");
      shift.classList.add("flex-shift");
      //shift.classList.add(tech.replace(" ", "-")); // person-specific colors
      shift.style = "height: " + size + "px;transform: translateY(" + offset + "px)";
      
      let p = document.createElement("p");
      p.innerHTML = "<span class='name'>" + tech + "</span><br>" + desc + "<br><strong>" + start + " - " + end + "</strong>";
      shift.appendChild(p);
      shift.id = tech.replace(" ", "-") + day + "-" + start + "-" + end;
      $(anchor).appendChild(shift);
      
      shift.onclick = function() {
        shift.classList.toggle("expand");
      };
      
      return shift;
  }
  
  function getShifts() {
    fetch("process_iCal.php?type=techs")
      .then(checkStatus)
      .then(JSON.parse)
      .then(populateShifts)
      .catch(console.log);
  }
  
  function populateShifts(json) {
    for (let i = 0; i < json.length; i++) {
      addShift(json[i].tech, "Maintenance Tech", json[i].weekday, json[i].start, json[i].end);
    }
  }
  
  function getWorkshops() {
    fetch("process_iCal.php?type=workshops")
      .then(checkStatus)
      .then(JSON.parse)
      .then(populateWorkshops)
      .catch(console.log);
  }
  
  function populateWorkshops(json) {
    for (let i = 0; i < json.length; i++) {
      addWorkshop(json[i].name, json[i].month, json[i].num, json[i].start, json[i].end, json[i].weekday);
    }
  }
  
  function addWorkshop(name, month, num, start, end, weekday) {
    let workshop = document.createElement('div');
    let dateBox = document.createElement('div');
    dateBox.classList.add('ws-date');
    let dateNum = document.createElement('h2');
    let dateMonth = document.createElement('p');
    let nameBox = document.createElement('div');
    nameBox.classList.add('ws-name');
    let timeBox = document.createElement('div');
    timeBox.classList.add('ws-time');
    
    dateNum.innerHTML = num;
    dateMonth.innerHTML = month;
    nameBox.innerHTML = name;
    timeBox.innerHTML = start + " - " + end;
    
    dateBox.appendChild(dateNum);
    dateBox.appendChild(dateMonth);
    
    workshop.appendChild(dateBox);
    workshop.appendChild(nameBox);
    workshop.appendChild(timeBox);
    $('workshops').appendChild(workshop);
  }
})();