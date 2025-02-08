let userData = {
    username: "",
    password: "",
    gender: "",
    matchUsername: "",
    matchDistance: 0,
    characterPoints: [0, 0, 0],
    partnerPoints: [0, 0, 0],
    answers: []  // Store selected answers to allow navigation
};

// Example questions
const questions = [
    {
        text: "Are you introverted or extroverted?",
        options: [
            { text: "Introverted", charPoints: [1, 0, 0], partPoints: [0, 1, 0] },
            { text: "Extroverted", charPoints: [0, 1, 0], partPoints: [1, 0, 0] }
        ]
    },
    {
        text: "Do you prefer cats or dogs?",
        options: [
            { text: "Cats", charPoints: [1, 0, 0], partPoints: [0, 1, 0] },
            { text: "Dogs", charPoints: [0, 1, 0], partPoints: [1, 0, 0] }
        ]
    },
    {
        text: "Do you prefer books or movies?",
        options: [
            { text: "Books", charPoints: [1, 1, 0], partPoints: [0, 0, 1] },
            { text: "Movies", charPoints: [0, 0, 1], partPoints: [1, 1, 0] }
        ]
    }
];

let currentQuestion = 0;

// Set the specific time you want (e.g., 9th February 2025, 19:14:00 on TR timezone yani +3 UTC)
const cutoffDate = new Date("2025-02-09T16:14:00Z");

window.onload = function() {
    checkDate();
};

function checkDate() {
    const currentDate = new Date();
    
    // Check if it's after the cutoff date
    if (currentDate >= cutoffDate) {
        // If it's after the cutoff, hide the sign-in page and show the closed message
        document.getElementById("login").style.display = "none";
        document.getElementById("closedMessage").style.display = "block";
    } else {
        // If it's before the cutoff, show the login page and hide the closed message
        document.getElementById("login").style.display = "block";
        document.getElementById("closedMessage").style.display = "none";
    }
}

function signUp() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (!username.startsWith("@") || password.length < 4) {
        alert("Invalid username or password too short!");
        return;
    }

    userData.username = username;
    userData.password = password;
    userData.characterPoints = [0, 0, 0];
    userData.partnerPoints = [0, 0, 0];
    userData.answers = Array(questions.length).fill(null); // Reset answers

    localStorage.setItem("user", JSON.stringify(userData));
    alert("Account created! Now sign in.");
}

function signIn() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    let storedUser = JSON.parse(localStorage.getItem("user"));

    if (storedUser && storedUser.username === username && storedUser.password === password) {
        alert("Login successful!");
        document.getElementById("login").style.display = "none";
        document.getElementById("quiz").style.display = "block";
        showQuestion();
    } else {
        alert("Invalid credentials!");
    }
}

function selectGender(gender) {
    userData.gender = gender;
    document.getElementById("genderSelection").style.display = "none";  // Hide gender selection
    document.getElementById("quiz").style.display = "block";  // Show the quiz
    alert(`Gender selected: ${gender}`);
}

function showQuestion() {
    if (currentQuestion >= questions.length) {
        document.getElementById("quiz").innerHTML = '<button onclick="finishQuiz()">Finish</button>';
        return;
    }

    let q = questions[currentQuestion];
    let quizDiv = document.getElementById("quiz");
    quizDiv.innerHTML = `
        <h2>${q.text}</h2>
        <p>Question ${currentQuestion + 1} / ${questions.length}</p>
        <button id="option1">${q.options[0].text}</button>
        <button id="option2">${q.options[1].text}</button>
        <br>
        ${currentQuestion > 0 ? '<button onclick="previousQuestion()">Previous</button>' : ''}
    `;

    document.getElementById("option1").onclick = function () {
        answerQuestion(0);
    };
    document.getElementById("option2").onclick = function () {
        answerQuestion(1);
    };

    // Highlight previously selected answer (if any)
    if (userData.answers[currentQuestion] !== null) {
        document.getElementById(`option${userData.answers[currentQuestion] + 1}`).style.backgroundColor = "lightblue";
    }
}

function answerQuestion(choiceIndex) {
    let q = questions[currentQuestion];

    // Remove old points (if revisiting a question)
    if (userData.answers[currentQuestion] !== null) {
        let oldChoice = userData.answers[currentQuestion];
        userData.characterPoints = userData.characterPoints.map((v, i) => v - q.options[oldChoice].charPoints[i]);
        userData.partnerPoints = userData.partnerPoints.map((v, i) => v - q.options[oldChoice].partPoints[i]);
    }

    // Add new choice's points
    userData.characterPoints = userData.characterPoints.map((v, i) => v + q.options[choiceIndex].charPoints[i]);
    userData.partnerPoints = userData.partnerPoints.map((v, i) => v + q.options[choiceIndex].partPoints[i]);

    // Store answer
    userData.answers[currentQuestion] = choiceIndex;

    // Move forward
    currentQuestion++;
    showQuestion();
}

function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion();
    }
}

async function finishQuiz() {
    alert("Quiz finished! Saving your data...");

    const githubRepo = "HasanSelcuk/dating-app-private"; // 🔹 Replace with your GitHub repo name
    const githubToken = "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"; // 🔹 Replace with your GitHub token
    const filePath = "data.json";
    const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;

    let response = await fetch(apiUrl, { headers: { Authorization: `token ${githubToken}` } });
    let fileData = await response.json();

    let content = JSON.parse(atob(fileData.content)); // Decode Base64 content

    // 2️⃣ Check if the username already exists in the data
    const userExists = content.some(user => user.username === userData.username);
    
    if (userExists) {
        alert("Username already taken! Please choose a different one.");
        return; // Stop further execution if the username exists
    }

    // 3️⃣ Add new user data if username is unique
    content.push(userData);

    // 4️⃣ Upload updated data.json back to GitHub
    let updateResponse = await fetch(apiUrl, {
        method: "PUT",
        headers: {
            Authorization: `token ${githubToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: "Update data.json with new user",
            content: btoa(JSON.stringify(content, null, 2)), // Encode to Base64
            sha: fileData.sha // Required to update existing file
        })
    });

    if (updateResponse.ok) {
        alert("Data saved successfully!");
    } else {
        alert("Error saving data!");
    }
}