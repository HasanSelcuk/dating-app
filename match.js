// Define the cutoff date for the matching process
const cutoffDate = new Date("2025-02-11T00:00:00Z"); // UTC Date for matching (can be adjusted based on your needs)

// Check if the current time is after the cutoff date
function isMatchOpen() {
    const currentDate = new Date();
    return currentDate >= cutoffDate; // Returns true if it's after the cutoff date
}

// Function to check if the user is logged in
function checkLoginStatus() {
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");
    return username && password; // Return true if both are stored
}

// Function to check the page status (whether login form, closed message, or match info is shown)
function checkPageStatus() {
    const isLoggedIn = checkLoginStatus();
    
    if (!isLoggedIn) {
        document.getElementById("loginForm").style.display = "block";
        document.getElementById("matchInfo").style.display = "none";
        document.getElementById("closedMessage").style.display = "none";
    } else if (!isMatchOpen()) {
        document.getElementById("closedMessage").style.display = "block";
        document.getElementById("matchInfo").style.display = "none";
        document.getElementById("loginForm").style.display = "none";
    } else {
        document.getElementById("loginForm").style.display = "block";
        document.getElementById("closedMessage").style.display = "none";
        document.getElementById("matchInfo").style.display = "none";
    }
}

// Handle user login
async function signIn() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const userData = {
        username: username,
        password: password
    };

    const githubRepo = "HasanSelcuk/dating-app-private"; // Replace with your GitHub repo name
    const filePath = "data.json";
    const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;

    let response = await fetch(apiUrl);
    let fileData = await response.json();

    let content = JSON.parse(atob(fileData.content)); // Decode Base64 content

    // Check if the username already exists in the data
    const userExists = content.some(user => user.username === userData.username && user.password === userData.password);
    
    if (userExists) {
        // Store the username and password in localStorage for use in other functions
        localStorage.setItem("username", username);
        localStorage.setItem("password", password);

        alert("Login successful!");
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("closedMessage").style.display = "none";
        document.getElementById("matchInfo").style.display = "block";
        displayMatchResult(); // Now call the function to display the match
    } else {
        alert("Invalid username or password.");
    }
}

// Display the match result (after the cutoff date)
async function displayMatchResult() {
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");
    const githubRepo = "HasanSelcuk/dating-app-private"; // Replace with your GitHub repo name
    const filePath = "data.json";
    const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;

    let response = await fetch(apiUrl);
    let fileData = await response.json();

    let content = JSON.parse(atob(fileData.content)); // Decode Base64 content

    // Find the current user's data and give alert of users data
    let currentUser = content.find(user => user.username === username);
    alert(`User data: ${JSON.stringify(currentUser)}`);

    // Find the best match name and distance
    let { matchUsername, matchDistance } = await findBestMatch(currentUser, content);

    alert(`Your best match is: ${matchUsername} with a distance of ${matchDistance}`);
}

// Function to find the best match based on the algorithm
async function findBestMatch(user, allUsers) {

    // If the user already has a match, return that match. Else, compute the best match
    if (user.matchUsername) {

        alert(`we already calculated all matches`);
        return { matchUsername: user.matchUsername, matchDistance: user.matchDistance };
    }
    else {
        // compute all matches for each user and save it in the data.json file
        alert(`We are calculating all matches for each user`);

        alert(`Our boy ${user.username} has first match ${user.matchUsername}`);


        let updatedUsers = calculateAllMatches(allUsers);
        // Overwrite the data.json file with the updated users for future use
        
        const githubRepo = "HasanSelcuk/dating-app-private"; // Replace with your GitHub repo name
        const filePath = "data.json";
        const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;
    
        // Fetch the current data.json file from GitHub
        let response = await fetch(apiUrl);
        let fileData = await response.json();
        
        let content = JSON.parse(atob(fileData.content)); // Decode Base64 content
        
        content = updatedUsers;
        console.log(content);
        
        // Upload the updated data.json file back to GitHub
        let updateResponse = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Update data.json with new matches", // Commit message
                content: btoa(JSON.stringify(content, null, 2)), // Encode to Base64
                sha: fileData.sha // Required to update the file
            })
        });
    
        if (updateResponse.ok) {
            alert("Matches saved successfully!");
        } else {
            alert("Error saving matches!");
        }

        let updatedUser = updatedUsers.find(u => u.username === user.username);

        alert(`Our boy ${updatedUser.username} has then match ${updatedUser.matchUsername}`);
        return { matchUsername: updatedUser.matchUsername, matchDistance: updatedUser.matchDistance };
    }

}

function calculateAllMatches(users) {
    let boys = users.filter(u => u.gender === "erkek");
    let girls = users.filter(u => u.gender === "disi");

    let maxSize = Math.max(boys.length, girls.length);
    let costMatrix = Array.from({ length: maxSize }, () => new Array(maxSize).fill(99999)); // Fill with high value

    // Compute cost matrix (difference for each boy-girl pair)
    for (let i = 0; i < boys.length; i++) {
        for (let j = 0; j < girls.length; j++) {
            let diff = 0;
            for (let k = 0; k < boys[i].characterPoints.length; k++) {
                diff += Math.pow(boys[i].characterPoints[k] - girls[j].partnerPoints[k], 2)
                      + Math.pow(girls[j].characterPoints[k] - boys[i].partnerPoints[k], 2);
            }
            costMatrix[i][j] = diff;
        }
    }

    console.debug(`cost matrix is ${costMatrix}`)

    // Store the copy of the cost matrix
    let costMatrixCopy = costMatrix.map(row => [...row]);

    
    let matches = hungarianAlgorithm(costMatrix);
    console.debug(`Our matches are ${matches}`);
    // Assign matches based on the result
    let matchedBoys = new Set();
    let matchedGirls = new Set();

    matches.forEach(([boyIndex, girlIndex]) => {
        if (boyIndex < boys.length && girlIndex < girls.length) {
            let matchDistance = costMatrixCopy[boyIndex][girlIndex];

            boys[boyIndex].matchUsername = girls[girlIndex].username;
            boys[boyIndex].matchDistance = matchDistance;
            
            girls[girlIndex].matchUsername = boys[boyIndex].username;
            girls[girlIndex].matchDistance = matchDistance;

            matchedBoys.add(boyIndex);
            matchedGirls.add(girlIndex);
        }
    });

    // Assign "senin esin benzerin yokmus abi" to unmatched boys
    for (let i = 0; i < boys.length; i++) {
        if (!matchedBoys.has(i)) {
            boys[i].matchUsername = "senin esin benzerin yokmus abi";
            boys[i].matchDistance = 99999;
        }
    }

    // Assign "senin esin benzerin yokmus abla" to unmatched girls
    for (let j = 0; j < girls.length; j++) {
        if (!matchedGirls.has(j)) {
            girls[j].matchUsername = "senin esin benzerin yokmus abla";
            girls[j].matchDistance = 99999;
        }
    }


    return users; // Updated users with matches
}


function hungarianAlgorithm(costMatrix) {
    let n = costMatrix.length;
    let labelRow = new Array(n).fill(0);
    let labelCol = new Array(n).fill(0);
    let matchCol = new Array(n).fill(-1);

    // Step 1: Subtract row minima
    for (let i = 0; i < n; i++) {
        let rowMin = Math.min(...costMatrix[i]);
        for (let j = 0; j < n; j++) {
            costMatrix[i][j] -= rowMin;
        }
    }

    // Step 2: Subtract column minima
    for (let j = 0; j < n; j++) {
        let colMin = Math.min(...costMatrix.map(row => row[j]));
        for (let i = 0; i < n; i++) {
            costMatrix[i][j] -= colMin;
        }
    }

    // Step 3: Try to find a perfect matching using DFS
    function findMatch(row, visitedRow, visitedCol) {
        for (let col = 0; col < n; col++) {
            if (costMatrix[row][col] === 0 && !visitedCol[col]) {
                visitedCol[col] = true;
                if (matchCol[col] === -1 || findMatch(matchCol[col], visitedRow, visitedCol)) {
                    matchCol[col] = row;
                    return true;
                }
            }
        }
        return false;
    }

    for (let row = 0; row < n; row++) {
        let visitedRow = new Array(n).fill(false);
        let visitedCol = new Array(n).fill(false);
        findMatch(row, visitedRow, visitedCol);
    }

    // Convert matchCol back to pairs
    let matches = [];
    for (let j = 0; j < n; j++) {
        if (matchCol[j] !== -1) {
            matches.push([matchCol[j], j]); // (boyIndex, girlIndex)
        }
    }

    return matches;
}

// Initialize the page when loaded
checkPageStatus(); // Check page status to show either the login form, closed message, or match result
