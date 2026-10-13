/* =========================================================
   BTMS AUTHENTICATION & ACCESS CONTROL
   ========================================================= */


/* =========================================================
   CURRENT USER
   ========================================================= */

const currentUser =
    JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
    window.location.href = "login.html";
}


/* =========================================================
   ADMIN-ONLY PAGES
   ========================================================= */

const adminPages = [
    "dashboard.html"
];


/* =========================================================
   MANAGER PAGES
   ========================================================= */

const managerPages = [
    "bookinghistory.html",
    "buses.html",
    "platform.html",
    "staff.html",
    "ticket.html",
    "routes.html",
    "schedules.html",
    "reports.html"
];


/* =========================================================
   TERMINAL OFFICER PAGES
   ========================================================= */

const terminalOfficerPages = [
    "bookinghistory.html",
    "buses.html",
    "platform.html",
    "ticket.html",
    "routes.html",
    "schedules.html"
];


/* =========================================================
   CASHIER PAGES
   ========================================================= */

const cashierPages = [
    "bookinghistory.html",
    "ticket.html"
];


/* =========================================================
   SECURITY PAGES
   ========================================================= */

const securityPages = [
    "platform.html",
    "ticket.html"
];


/* =========================================================
   CURRENT PAGE
   ========================================================= */

const currentPage =
    window.location.pathname.split("/").pop();

function getDefaultPage(user) {

    if (user.role === "admin") {
        return "dashboard.html";
    }

    if (user.role === "staff") {

        const jobPosition =
            String(user.jobPosition || "")
                .trim()
                .toLowerCase();

        if (
            jobPosition === "manager" ||
            jobPosition === "terminal officer"
        ) {
            return "schedules.html";
        }

        if (jobPosition === "cashier") {
            return "bookinghistory.html";
        }

        if (jobPosition === "security") {
            return "platform.html";
        }
    }

    return "available-schedules.html";
}


/* =========================================================
   CHECK IF CURRENT PAGE REQUIRES MANAGEMENT ACCESS
   ========================================================= */

const isManagementPage =
    managerPages.includes(currentPage) ||
    terminalOfficerPages.includes(currentPage) ||
    cashierPages.includes(currentPage) ||
    securityPages.includes(currentPage);


/* =========================================================
   ADMIN ACCESS
   ========================================================= */

if (adminPages.includes(currentPage)) {

    if (currentUser.role !== "admin") {

        alert(
            "Access Denied! This page is restricted to administrators."
        );

        window.location.href =
            getDefaultPage(currentUser);
    }

}


/* =========================================================
   MANAGEMENT ACCESS
   ========================================================= */

else if (isManagementPage) {

    /*
     * Admin has full access to all management pages.
     */

    if (currentUser.role === "admin") {
        // Allow access
    }


    /*
     * Terminal staff
     */

    else if (currentUser.role === "staff") {

        const jobPosition =
            String(
                currentUser.jobPosition || ""
            )
                .trim()
                .toLowerCase();


        /* -------------------------------------------------
           MANAGER
           ------------------------------------------------- */

        if (
            managerPages.includes(currentPage) &&
            jobPosition === "manager"
        ) {

            // Allow access

        }


        /* -------------------------------------------------
           TERMINAL OFFICER
           ------------------------------------------------- */

        else if (
            terminalOfficerPages.includes(currentPage) &&
            jobPosition === "terminal officer"
        ) {

            // Allow access

        }


        /* -------------------------------------------------
           CASHIER
           ------------------------------------------------- */

        else if (
            cashierPages.includes(currentPage) &&
            jobPosition === "cashier"
        ) {

            // Allow access

        }


        /* -------------------------------------------------
           SECURITY
           ------------------------------------------------- */

        else if (
            securityPages.includes(currentPage) &&
            jobPosition === "security"
        ) {

            // Allow access

        }


        /* -------------------------------------------------
           ACCESS DENIED
           ------------------------------------------------- */

        else {

            alert(
                "Access Denied! You do not have permission to access this page."
            );

            window.location.href =
                getDefaultPage(currentUser);
        }

    }


    /*
     * Passenger/User
     */

    else {

        alert(
            "Access Denied! Management access is restricted."
        );

        window.location.href =
            getDefaultPage(currentUser);
    }

}