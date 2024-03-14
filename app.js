const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertToCamelCase = (data) => ({
  playerId: data.player_id,
  playerName: data.player_name,
  matchId: data.match_id,
  match: data.match,
  year: data.year,
  playerMatchId: data.player_match_id,
  score: data.score,
  fours: data.fours,
  sixes: data.sixes,
});

//API1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
  SELECT * FROM player_details;
  `;
  const playerList = await db.all(getPlayersQuery);
  response.send(playerList.map((each) => convertToCamelCase(each)));
});

//API2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  SELECT * FROM player_details WHERE player_id=${playerId};
  `;
  const player = await db.get(getPlayerQuery);
  response.send(convertToCamelCase(player));
});

//API3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
  UPDATE 
    player_details
  SET 
    player_name='${playerName}'
  WHERE 
    player_id=${playerId};
  `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM match_details WHERE match_id=${matchId}
    `;
  const match = await db.get(getMatchQuery);
  response.send(convertToCamelCase(match));
});

//API5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
  SELECT match_id, match, year
  FROM 
    player_match_score
  NATURAL JOIN
    match_details
  WHERE 
    player_id=${playerId};
  `;
  const playerMatchesArray = await db.all(getPlayerMatches);
  response.send(playerMatchesArray.map((each) => convertToCamelCase(each)));
});

//API6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
  SELECT player_id, player_name FROM player_match_score
  NATURAL JOIN
    player_details
  WHERE 
    match_id=${matchId};
  `;
  const matchPLayers = await db.all(getMatchPlayersQuery);
  response.send(matchPLayers.map((each) => convertToCamelCase(each)));
});

//API7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPLayerScores = `
  SELECT
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
  FROM 
    player_match_score
  NATURAL JOIN
    player_details
  WHERE 
    player_id=${playerId};
  `;
  const PlayerScores = await db.get(getPLayerScores);
  response.send(PlayerScores);
});

module.exports = app;
