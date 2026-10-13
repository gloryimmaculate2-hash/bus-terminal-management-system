const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();

        const email = document.getElementById("email").value.trim();

        const username = document.getElementById("username").value.trim();

        const password = document.getElementById("password").value;

        const confirmPassword = document.getElementById("confirmPassword").value;

          if(password.length < 6){
            alert("Password must be at least six(6) characters long.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Password do not match!");
            return;
        }

        let users = JSON.parse(localStorage.getItem("users")) || [];

        const userExist = users.find(
            user =>
                user.username === username ||
                user.email === email
        );

        if (userExist) {
            alert("Username or Email already exists!");
            return;
        }

        const newUser = {
            fullName,
            email,
            username,
            password,
            role: "user",
            createdAt: new Date().toLocaleString()
        };

        users.push(newUser);

        localStorage.setItem("users", JSON.stringify(users));

        loadNotifyMessage("user", {
            username: user.username
        });

        alert("Account created successfully!");

        registerForm.reset();

        window.location.href = "login.html";
    });
}