const defaultAdmin = {
    fullName: "System Administrator",
    email: "admin@btms.com",
    username: "admin",
    password: "admin123",
    role: "admin",
    createdAt: new Date().toLocaleString()
};

let users = JSON.parse(localStorage.getItem("users")) || [];

const adminExists = users.some(user => user.role === "admin");

if (!adminExists) {
    users.push(defaultAdmin);
    localStorage.setItem("users", JSON.stringify(users));
}

const loginForm = document.getElementById("loginForm")

if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();

        const password = document.getElementById("password").value;

        let users = JSON.parse(localStorage.getItem("users")) || [];

        const user = users.find(
            u =>
                u.username === username &&
                u.password === password
        );

        if (!user) {
            alert("Invalid user or password");
            return;
        }

        localStorage.setItem("currentUser", JSON.stringify(user));
        //loadNotifyMessage("login", {username: user.username});

        if (user.role === "admin") {
            window.location.href = "dashboard.html";
        } else if (user.role === "staff") {

            const jobPosition =
                String(user.jobPosition || "")
                    .trim()
                    .toLowerCase();

            if (
                jobPosition === "manager" ||
                jobPosition === "terminal officer"
            ) {
                window.location.href = "schedules.html";

            } else if (jobPosition === "cashier") {
                window.location.href = "bookinghistory.html";

            } else if (jobPosition === "security") {
                window.location.href = "platform.html";

            } else {
                window.location.href = "schedules.html";
            }

        } else {
            window.location.href = "available-schedules.html";
        }
    })
}


