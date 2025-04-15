
  let teams = [], players = [], currentPlayer = 0;
  let currentBid = 0, highestBidder = null;
  const maxBid = 9.5, bidTime = 10;
  let countdown, timeLeft = bidTime;
  let idleTimer;

  const buzzer = document.getElementById("buzzer");
  const bgAudio = document.getElementById("bgAudio");

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  document.getElementById('teamCount').addEventListener('change', createTeamInputs);
  createTeamInputs();

  function createTeamInputs() {
    const count = +document.getElementById('teamCount').value;
    const container = document.getElementById('teamInputs');
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      container.innerHTML += `
        <div class="team-box">
          <input placeholder="Team Name" id="teamName${i}"><br>
          <input type="file" accept="image/*" id="teamLogo${i}"><br>
        </div>`;
    }
  }

  function saveTeams() {
    const count = +document.getElementById('teamCount').value;
    teams = [];
    let completed = 0;
    for (let i = 0; i < count; i++) {
      const name = document.getElementById(`teamName${i}`).value;
      const file = document.getElementById(`teamLogo${i}`).files[0];
      if (!name || !file) return alert("Fill all details.");
      const reader = new FileReader();
      reader.onload = () => {
        teams.push({ name, logo: reader.result, purse: 10, squad: [] });
        completed++;
        if (completed === count) {
          show('playerScreen');
          bgAudio.volume = 0.2;
          bgAudio.play().catch(err => console.log("Autoplay error:", err));
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function addPlayer() {
    const name = document.getElementById('playerName').value;
    const file = document.getElementById('playerImage').files[0];
    const price = +document.getElementById('playerPrice').value;
    if (!name || !file || !price) return alert("Enter all player details.");
    const reader = new FileReader();
    reader.onload = () => {
      players.push({ name, image: reader.result, basePrice: price });
      document.getElementById('playerList').innerHTML += `<p>${name} - ₹${price} Cr</p>`;
      document.getElementById('playerName').value = '';
      document.getElementById('playerImage').value = '';
      document.getElementById('playerPrice').value = '';
    };
    reader.readAsDataURL(file);
  }

  function startAuction() {
    if (players.length === 0) return alert("Add at least one player.");
    currentPlayer = 0;
    show('auctionScreen');
    loadPlayer();
  }

  function loadPlayer() {
    if (currentPlayer >= players.length) {
      displayFinalSquads();
      return show('squadScreen');
    }
    const p = players[currentPlayer];
    currentBid = p.basePrice;
    highestBidder = null;
    document.getElementById('playerNameDisplay').innerText = p.name;
    document.getElementById('playerImgDisplay').src = p.image;
    document.getElementById('playerBaseDisplay').innerText = `Base Price: ₹${p.basePrice} Cr`;
    document.getElementById('playerBidDisplay').innerText = `Current Bid: ₹${currentBid} Cr`;
    document.getElementById('playerTeamDisplay').innerText = `Highest Bidder: None`;
    document.getElementById('soldMsg').innerText = '';
    const btns = document.getElementById('bidButtons');
    btns.innerHTML = '';
    teams.forEach((t, i) => {
      const b = document.createElement('button');
      b.innerText = `${t.name} (₹${t.purse} Cr)`;
      b.onclick = () => placeBid(i);
      btns.appendChild(b);
    });
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startTimer, 5000);
  }

  function placeBid(index) {
    const nextBid = parseFloat((currentBid + 0.5).toFixed(1));
    if (nextBid > maxBid) return alert(`Max bid is ₹${maxBid} Cr.`);
    if (teams[index].purse >= nextBid) {
      currentBid = nextBid;
      highestBidder = index;
      document.getElementById('playerBidDisplay').innerText = `Current Bid: ₹${currentBid} Cr`;
      document.getElementById('playerTeamDisplay').innerText = `Highest Bidder: ${teams[index].name}`;
      const btns = document.getElementById('bidButtons').children;
      for (let i = 0; i < btns.length; i++) {
        btns[i].innerText = `${teams[i].name} (₹${teams[i].purse} Cr)`;
      }
      clearInterval(countdown);
      document.getElementById('timer').innerText = '';
      clearTimeout(idleTimer);
      idleTimer = setTimeout(startTimer, 5000);
    } else {
      alert("Not enough money.");
    }
  }

  function startTimer() {
    timeLeft = bidTime;
    document.getElementById('timer').innerText = `Time Left: ${timeLeft}s`;
    countdown = setInterval(() => {
      timeLeft--;
      document.getElementById('timer').innerText = `Time Left: ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(countdown);
        nextPlayer();
      }
    }, 1000);
  }

  function nextPlayer() {
    clearInterval(countdown);
    clearTimeout(idleTimer);
    document.getElementById('timer').innerText = '';
    const p = players[currentPlayer];
    if (highestBidder !== null) {
      teams[highestBidder].purse -= currentBid;
      teams[highestBidder].squad.push({ ...p, price: currentBid });
      document.getElementById('soldMsg').innerText = `${p.name} SOLD to ${teams[highestBidder].name} for ₹${currentBid} Cr`;
      buzzer.play().catch(err => console.log("Sound play error:", err));
    } else {
      document.getElementById('soldMsg').innerText = `${p.name} went UNSOLD`;
    }
    currentPlayer++;
    setTimeout(loadPlayer, 2000);
  }

  function showLiveSquads() {
    let html = teams.map(t => `
      <div class="team-box">
        <h4>${t.name} (₹${t.purse} Cr)</h4>
        <img src="${t.logo}" height="40"><br>
        <ul style="list-style:none;padding:0;">${
          t.squad.map(p => `<li>${p.name} - ₹${p.price} Cr</li>`).join('') || '<li>No Players</li>'
        }</ul>
      </div>
    `).join('');
    document.getElementById('soldMsg').innerHTML = html;
  }

  function displayFinalSquads() {
    let html = teams.map(t => `
      <div class="team-box">
        <h4>${t.name} (Remaining: ₹${t.purse} Cr)</h4>
        <img src="${t.logo}" height="40"><br>
        <p>Total Players: ${t.squad.length}</p>
        <ul style="list-style:none;padding:0;">${
          t.squad.map(p => `<li>${p.name} - ₹${p.price} Cr</li>`).join('') || '<li>No Players</li>'
        }</ul>
      </div>
    `).join('');
    document.getElementById('squadsDisplay').innerHTML = html;
  }

  function resetAll() {
    if (confirm("Reset everything?")) {
      location.reload();
    }
  }
   if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}