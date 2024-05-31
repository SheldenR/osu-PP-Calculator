chrome.tabs.query({
  active: true,
  lastFocusedWindow: true
}, function(tabs) {
  var tab = tabs[0]; // Current tab

  // Valid osu! beatmap page
  if (tab.url.substring(0,31) == "https://osu.ppy.sh/beatmapsets/" && tab.url.length > 30){
    const beatmapStringArray = tab.url.substring(31).split("#");
    const beatmapSetID = beatmapStringArray[0];
    const difficultyID = beatmapStringArray[1].split("/")[1];
    const ppcalcAPIURL = "https://pp.osuck.net/pp?id=" + difficultyID;
    const settings = document.getElementById("settingsIcon");
    const back = document.getElementById("backIcon");
    const slider = document.getElementById("accSlider");
    const extraMods = document.getElementById("extraMods");

    // Display beatmap data values
    document.getElementById("settingsPage").hidden = true;
    document.getElementById("backIcon").hidden = true;
    document.getElementById("navigationError").hidden = true;
    document.getElementById("coverImage").src = "https://assets.ppy.sh/beatmaps/" + beatmapSetID + "/covers/cover.jpg";
    document.getElementById("rankAchieved").src = "https://osu.ppy.sh/assets/images/GradeSmall-S.3b4498a9.svg";
    document.getElementById("accSlider").addEventListener("input", (event) => {
      document.getElementById("accSliderLabel").textContent = "Accuracy: " + event.target.value + "%";
    });
    
    chrome.storage.local.get("extraMods").then((result) => {
      document.getElementById("moreMods").checked = result["extraMods"];
      extraMods.hidden = !result["extraMods"];
    });

    // Custom slider styling
    slider.style.background = 'rgb(255,204,33)';
    slider.addEventListener("input", function(){
      let x = (slider.value * 5) - 400;
      let color = 'linear-gradient(90deg, rgb(255,204,33) ' + x + '%, rgb(17,24,28) ' + x + '%)';
      slider.style.background = color;
    }); 
    
    const openSettings = (choice) => { // Wipe DOM
      if (choice == true) {
        settings.hidden = true;
        back.hidden = false;
        document.getElementById("settingsPage").hidden = false;
        document.getElementById("extensionDetails").hidden = true;
        document.getElementById("statusDiv").hidden = true;
        document.getElementById("coverImageCrop").hidden = true;
        document.getElementById("coverImage").hidden = true;
        document.getElementById("beatmapDetails").hidden = true;
        document.getElementById("starRatingDiv").hidden = true;
      } else {
        settings.hidden = false;
        back.hidden = true;
        document.getElementById("settingsPage").hidden = true;
        document.getElementById("extensionDetails").hidden = false;
        document.getElementById("statusDiv").hidden = false;
        document.getElementById("coverImageCrop").hidden = false;
        document.getElementById("coverImage").hidden = false;
        document.getElementById("beatmapDetails").hidden = false;
        document.getElementById("starRatingDiv").hidden = false;
      }
    }
    
    // Open settings page
    settings.addEventListener("click", function(){
      openSettings(true);
    });

    // Leave settings page
    back.addEventListener("click", function(){ 
      openSettings(false);
      chrome.storage.local.get("extraMods").then((result) => {
        extraMods.hidden = !result["extraMods"];
      });
    });

    // Update local storage for mod options
    document.getElementById('moreMods').addEventListener("click", function() {
      if (document.getElementById("moreMods").checked){
        chrome.storage.local.set({"extraMods": true });
      } else if (!document.getElementById("moreMods").checked) {
        chrome.storage.local.set({"extraMods": false });
      }
    });
    
    function recalcPP() { // Recalculate PP values if mod combination is altered
      let modID = 0;
  
      if (document.getElementById("SO").checked){
        modID += 4096
      }

      if (document.getElementById("FL").checked){
        modID += 1024
      }
      
      if (document.getElementById("HT").checked){
        modID += 256
      }
  
      if (document.getElementById("DT").checked){
        modID += 64
      }
  
      if (document.getElementById("HR").checked){
        modID += 16
      }
  
      if (document.getElementById("HD").checked){
        modID += 8
      }

      if (document.getElementById("TD").checked){
        modID += 4
      }

      if (document.getElementById("EZ").checked){
        modID += 2
      }

      fetch(ppcalcAPIURL + "&mods=" + modID) 
      .then(response => { 
        if (response.ok) { 
          return response.json(); 
        } else { 
          throw new Error('API request failed'); 
        } 
      }) 
      .then(data => {
        console.log(ppcalcAPIURL + "&mods=" + modID); 
        let accuracy = Math.round(document.getElementById("accSlider").value * 10) / 10;
        let performancePoints = data.pp.acc[Math.round(accuracy)];
        if (Math.round(accuracy) != accuracy) { // If accuracy is not int
          // Attempt to fix accuracy curve
          if (accuracy > 97){ 
            performancePoints = Math.round(((data.pp.acc[Math.floor(accuracy)] * 0.6) + (data.pp.acc[Math.ceil(accuracy)] * 0.4)));
          } else {
            performancePoints = Math.round((data.pp.acc[Math.floor(accuracy)] + data.pp.acc[Math.ceil(accuracy)]) / 2);
          }
        } else { // If accuracy is int
          performancePoints = data.pp.acc[accuracy];
        }
        
        document.getElementById("mapStats").innerHTML = "AR: " + data.stats.ar + " OD: " + data.stats.od + " CS: " + data.stats.cs + " HP: " + data.stats.hp + " BPM: " + data.stats.bpm.api; 
        document.getElementById("stars").innerHTML = data.stats.star.pure;
        document.getElementById("performancePoints").innerHTML = performancePoints + "pp <span id='offWhite'>for " + accuracy + "%<span/>";
        
        if (accuracy > 85 && accuracy <= 91) {
          document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-A.d785e824.svg";
        } else if (accuracy <= 85) { 
          document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-B.e19fc91b.svg";
        } else{
          if (!document.getElementById("HD").checked){
            document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-S.3b4498a9.svg"
          } else {
            document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-S-Silver.811ae28c.svg"
          }
        }

      }) 
      .catch(error => { 
        console.error(error);
      });
    }
    
    fetch(ppcalcAPIURL) 
      .then(response => { // Parse API response
        if (response.ok) { 
          return response.json(); 
        } else { 
          throw new Error('API request failed'); 
        } 
      }) 
      .then(data => { // Display beatmap data
        if (data.status.id <= 0) {
          document.getElementById("rankedStatus").src = "/images/assets/unrankedIcon.png"
        } else if (data.status.id == 1) {
          document.getElementById("rankedStatus").src = "/images/assets/rankedIcon.png"
        } else if (data.status.id == 2 || data.status.id == 3) {
          document.getElementById("rankedStatus").src = "/images/assets/approvedIcon.png"
        } else {
          document.getElementById("rankedStatus").src = "/images/assets/lovedIcon.png"
        }

        if ((data.data.title).length >= 26) {
          data.data.title = (data.data.title).substring(0,23) + "...";
        }

        if ((data.data.diff).length >= 34) {
          data.data.diff = (data.data.diff).substring(0,31) + "...";
        }

        if ((data.data.artist).length >= 32) {
          data.data.artist = (data.data.artist).substring(0,29) + "...";
        }

        document.getElementById("beatmapDifficultyName").innerHTML = "[" + data.data.diff + "]";
        document.getElementById("beatmapName").innerHTML = data.data.title;
        document.getElementById("artistName").innerHTML = data.data.artist;

        document.getElementById("DT").addEventListener("click", recalcPP);
        document.getElementById("HD").addEventListener("click", recalcPP);
        document.getElementById("HR").addEventListener("click", recalcPP);
        document.getElementById("FL").addEventListener("click", recalcPP);
        document.getElementById("EZ").addEventListener("click", recalcPP);
        document.getElementById("HT").addEventListener("click", recalcPP);
        document.getElementById("SO").addEventListener("click", recalcPP);
        document.getElementById("TD").addEventListener("click", recalcPP);
        document.getElementById("accSlider").addEventListener("change", recalcPP);
        
        document.getElementById("mapStats").innerHTML = "AR: " + data.stats.ar + " OD: " + data.stats.od + " CS: " + data.stats.cs + " HP: " + data.stats.hp + " BPM: " + data.stats.bpm.api; 
        document.getElementById("stars").innerHTML = data.stats.star.pure;
        document.getElementById("performancePoints").innerHTML = data.pp.current + "pp <span id='offWhite'>for 100%<span/>";
        if (!document.getElementById("HD").checked){
          document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-S.3b4498a9.svg"
        } else {
          document.getElementById("rankAchieved").src="https://osu.ppy.sh/assets/images/GradeSmall-S-Silver.811ae28c.svg"
        }
      }) 
      .catch(error => { 
        console.error(error);
      });

  } else { // Not valid osu! beatmap page
    document.getElementById("navigationDiv").hidden = true;
    document.getElementById("settingsPage").hidden = true;
    document.getElementById("developerTag").hidden = true;
    document.getElementById("extensionDetails").hidden = true;
    document.getElementById("coverImageCrop").style.height = "1px";
    document.getElementById("coverImageCrop").style.paddingBottom = "0px";
    document.getElementById("coverImage").src = "";
    document.getElementById("beatmapDetails").innerHTML = "";
    document.getElementById("starRatingDiv").innerHTML = "";
  }
});