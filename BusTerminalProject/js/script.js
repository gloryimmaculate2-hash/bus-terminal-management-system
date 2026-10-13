//==================================
//Bus Terminal Management System
//=================================

let scheduleChart = null;
let bookingChart = null;
let revenueChart = null;
let busStatisticsChart = null;
let topRoutesChart = null;
let genderChart = null;

const newDate = document.getElementById("newDate");
if (newDate) {
    newDate.textContent = new Date().toLocaleString();
}


console.log("script loading")

let editIndex = -1;

//Wait for page to load

document.addEventListener("DOMContentLoaded", () => {
    const busForm = document.getElementById("busForm");

    // Stop if we're not on buses.html
    if (!busForm) return;

    const busStateInput = document.getElementById("busState");

    /*
     * STAFF STATE CONTROL
     */

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (
        currentUser &&
        currentUser.role === "staff" &&
        busStateInput
    ) {
        busStateInput.value = currentUser.state || "";
        busStateInput.readOnly = true;
    }

    loadBuses();

    busForm.addEventListener("submit", function (event) {
        event.preventDefault();

        let buses =
            JSON.parse(localStorage.getItem("buses")) || [];

        const busNumber =
            document.getElementById("busNumber").value.trim();

        const busType =
            document.getElementById("busType").value.trim();

        const capacity =
            document.getElementById("capacity").value.trim();

        let busState =
            document.getElementById("busState").value.trim();

        /*
         * STAFF CAN ONLY USE THEIR ASSIGNED STATE
         */

        if (
            currentUser &&
            currentUser.role === "staff"
        ) {
            const assignedState =
                String(currentUser.state || "").trim();

            if (!assignedState) {
                alert(
                    "Your account has no assigned state. Please contact the administrator."
                );
                return;
            }

            busState = assignedState;

            document.getElementById("busState").value =
                assignedState;
        }

        /*
         * DUPLICATE BUS CHECK
         */

        const duplicateBus = buses.some(
            (bus, index) =>
                bus.busNumber.trim().toLowerCase() ===
                busNumber.toLowerCase() &&
                bus.busType.trim().toLowerCase() ===
                busType.toLowerCase() &&
                index !== editIndex
        );

        if (duplicateBus) {
            alert("This bus number and type already exist.");
            return;
        }

        /*
         * STAFF CANNOT EDIT ANOTHER STATE'S BUS
         */

        if (editIndex !== -1 && currentUser?.role === "staff") {

            const existingBus = buses[editIndex];

            const assignedState =
                String(currentUser.state || "")
                    .trim()
                    .toLowerCase();

            const existingState =
                String(existingBus.state || "")
                    .trim()
                    .toLowerCase();

            if (existingState !== assignedState) {
                alert(
                    "Access Denied! You can only manage buses assigned to your terminal."
                );
                return;
            }
        }

        const bus = {
            state: busState,
            busNumber: busNumber,
            busType: busType,
            capacity: capacity,
            createdAt:
                editIndex === -1
                    ? new Date().toLocaleString()
                    : buses[editIndex].createdAt
        };

        if (editIndex === -1) {

            buses.push(bus);

            alert("Bus Added Successfully!");

        } else {

            buses[editIndex] = bus;

            editIndex = -1;

            document.querySelector("#busForm button").innerHTML =
                '<i class="fa-solid fa-plus"></i><span>Add Bus</span>';

            alert("Bus Updated Successfully!");
        }

        localStorage.setItem(
            "buses",
            JSON.stringify(buses)
        );

        loadNotifyMessage(
            "bus",
            { busNumber: bus.busNumber }
        );

        refreshDashboard();

        busForm.reset();

        /*
         * RESTORE STAFF STATE AFTER FORM RESET
         */

        if (
            currentUser &&
            currentUser.role === "staff" &&
            busStateInput
        ) {
            busStateInput.value =
                currentUser.state || "";

            busStateInput.readOnly = true;
        }

        loadBuses();
    });

    const searchInput =
        document.getElementById("searchBus");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            loadBuses
        );
    }
});
// document.addEventListener("DOMContentLoaded", () => {
//     const busForm = document.getElementById("busForm");

//     //Stop if we're not on buses.html
//     if (!busForm) return;
//     loadBuses();

//     busForm.addEventListener("submit", function (event) {
//         event.preventDefault();

//         let buses = JSON.parse(localStorage.getItem("buses")) || [];



//         const busNumber = document.getElementById("busNumber").value;
//         const busType = document.getElementById("busType").value;
//         const capacity = document.getElementById("capacity").value;
//         const busState = document.getElementById("busState").value;

//         const duplicateBus = buses.some(
//             (bus, index) =>
//                 bus.busNumber.trim().toLowerCase() === busNumber.trim().toLowerCase() &&
//                 bus.busType.trim().toLowerCase() === busType.trim().toLowerCase() &&
//                 index !== editIndex
//         );
//         if (duplicateBus) {
//             alert("This bus number and type already exist.");
//             return;
//         }


//         const bus = {
//             state: busState,
//             busNumber,
//             busType,
//             capacity,
//             createdAt: new Date().toLocaleString()
//         };


//         if (editIndex === -1) {
//             buses.push(bus);
//         } else {
//             buses[editIndex] = bus;
//             editIndex = -1;

//             document.querySelector("#busForm button").textContent = "Add Bus";
//         }

//         localStorage.setItem("buses", JSON.stringify(buses));
//         loadNotifyMessage("bus", { busNumber: bus.busNumber });

//         refreshDashboard();

//         alert("Bus Added Successfully!");

//         busForm.reset();
//         loadBuses();
//     });

//     const searchInput = document.getElementById("searchBus");

//     if (searchInput) {
//         searchInput.addEventListener("input", loadBuses);
//     }
// });

//========================
// Load Buses Section
//========================

function loadBuses() {
    const tableBody =
        document.getElementById("busTableBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    let buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    /*
     * FILTER BY TERMINAL STATE
     */

    let visibleBuses = buses.map(
        (bus, index) => ({
            bus,
            originalIndex: index
        })
    );

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        visibleBuses =
            visibleBuses.filter(item =>
                String(item.bus.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );
    }

    /*
     * UPDATE TOTAL BUSES
     * This counts all buses available
     * to the logged-in user.
     */

    const totalBuses =
        document.getElementById("totalBuses");

    if (totalBuses) {
        totalBuses.textContent =
            visibleBuses.length;
    }

    /*
     * SEARCH
     */

    const searchValue =
        document.getElementById("searchBus")
            ?.value
            .toLowerCase()
            .trim() || "";

    const filteredBuses =
        visibleBuses.filter(item =>
            String(item.bus.busNumber || "")
                .toLowerCase()
                .includes(searchValue)
        );

    /*
     * EMPTY STATE
     */

    if (filteredBuses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No buses available
                </td>
            </tr>
        `;
        return;
    }

    /*
     * DISPLAY BUSES
     */

    filteredBuses.forEach(
        ({ bus, originalIndex }) => {

            const row = `
                <tr>
                    <td data-label="State">
                        ${bus.state || "Not Assigned"}
                    </td>

                    <td data-label="Bus Number">
                        ${bus.busNumber}
                    </td>

                    <td data-label="Bus Type">
                        ${bus.busType}
                    </td>

                    <td data-label="Capacity">
                        ${bus.capacity}
                    </td>

                    <td data-label="Date Time">
                        ${bus.createdAt || "N/A"}
                    </td>

                    <td>
                        <button
                            onclick="editBus(${originalIndex})"
                            class="edit-btn">
                            Edit
                        </button>

                        <button
                            onclick="deleteBus(${originalIndex})"
                            class="delete-btn">
                            Delete
                        </button>
                    </td>
                </tr>
            `;

            tableBody.innerHTML += row;
        }
    );
}

// function loadBuses() {
//     const tableBody = document.getElementById("busTableBody");
//     if (!tableBody) return;
//     tableBody.innerHTML = "";

//     let buses = JSON.parse(localStorage.getItem("buses")) || [];

//     document.getElementById("totalBuses").textContent = buses.length;

//     if (buses.length === 0) {
//         tableBody.innerHTML = `
//             <tr>
//                <td colspan="5"
//                style="text-align:center;">
//                     No buses available
//                 </td>
//             </tr>
//         `;

//         document.getElementById("totalBuses").textContent = 0;
//         return;
//     }

//     const searchValue = document.getElementById("searchBus")?.value.toLowerCase() || "";

//     buses.filter(bus => bus.busNumber.toLowerCase().includes(searchValue)).forEach((bus, index) => {
//         let row = `
//             <tr>
//             <td data-label="State">${bus.state || "Not Assigned"}</td>
//               <td data-label="Bus Number">${bus.busNumber}</td>
//               <td data-label="Bus Type">${bus.busType}</td>
//               <td data-label="Capacity">${bus.capacity}</td>
//               <td data-label="Date Time">${bus.createdAt || "N/A"}</td>
//               <td>
//                 <button onclick="editBus(${index})"
//                   class="edit-btn">
//                     Edit
//                 </button>   
//                 <button onclick="deleteBus(${index})"
//                   class="delete-btn">
//                     Delete
//                 </button>
//               </td>
//             </tr>
//         `;

//         tableBody.innerHTML += row;
//     });
// }

//====================
//Delete Bus Section
//===================

function deleteBus(index) {

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    const bus = buses[index];

    if (!bus) {
        alert("Bus record not found.");
        return;
    }

    /*
     * STAFF STATE RESTRICTION
     */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        const busState =
            String(bus.state || "")
                .trim()
                .toLowerCase();

        if (busState !== assignedState) {
            alert(
                "Access Denied! You can only delete buses assigned to your terminal."
            );
            return;
        }
    }

    if (
        !confirm(
            "Are you sure you want to delete this bus?"
        )
    ) {
        return;
    }

    buses.splice(index, 1);

    localStorage.setItem(
        "buses",
        JSON.stringify(buses)
    );

    refreshDashboard();
    loadBuses();
}

// function deleteBus(index) {

//     if (!confirm("Are you sure you want to delete this bus?")
//     ) {
//         return;
//     }
//     let buses = JSON.parse(localStorage.getItem("buses")) || [];
//     buses.splice(index, 1);

//     localStorage.setItem("buses", JSON.stringify(buses));

//     refreshDashboard();
//     loadBuses();
// }

//================
//Edit Bus Section
//================

function editBus(index) {

    let buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    const bus = buses[index];

    if (!bus) {
        alert("Bus record not found.");
        return;
    }

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    /*
     * STAFF STATE RESTRICTION
     */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        const busState =
            String(bus.state || "")
                .trim()
                .toLowerCase();

        if (busState !== assignedState) {
            alert(
                "Access Denied! You can only edit buses assigned to your terminal."
            );
            return;
        }
    }

    document.getElementById("busState").value =
        bus.state || "";

    document.getElementById("busNumber").value =
        bus.busNumber;

    document.getElementById("busType").value =
        bus.busType;

    document.getElementById("capacity").value =
        bus.capacity;

    /*
     * KEEP STAFF STATE LOCKED
     */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {
        document.getElementById("busState").readOnly =
            true;
    }

    editIndex = index;

    document.querySelector(
        "#busForm button"
    ).innerHTML =
        '<i class="fa-solid fa-pen-to-square"></i><span>Update Bus</span>';
}
// function editBus(index) {
//     let buses = JSON.parse(localStorage.getItem("buses")) || [];

//     const bus = buses[index];

//     document.getElementById("busNumber").value = bus.busNumber;
//     document.getElementById("busType").value = bus.busType;
//     document.getElementById("capacity").value = bus.capacity;

//     editIndex = index;

//     document.querySelector("#busForm button").textContent = "Update Bus";
// }

//====================
//Routes Section
//===================

let routeEditIndex = -1;


/* =========================================================
   LOAD STATES
   ========================================================= */

function loadStateForRoute() {
    const routeState =
        document.getElementById("routeState");

    const originInput =
        document.getElementById("origin");

    if (!routeState) return;

    const buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let states = [
        ...new Set(
            buses
                .map(bus => bus.state)
                .filter(state => state)
        )
    ];

    if (currentUser && currentUser.role === "staff") {
        const assignedState =
            String(currentUser.state || "").trim();

        states = states.filter(state =>
            String(state).trim().toLowerCase() ===
            assignedState.toLowerCase()
        );

        routeState.innerHTML = `
            <option value="${assignedState}">
                ${assignedState}
            </option>
        `;

        routeState.value = assignedState;
        routeState.disabled = true;

        if (originInput) {
            originInput.value = assignedState;
            originInput.readOnly = true;
        }
    } else {
        routeState.disabled = false;

        routeState.innerHTML =
            '<option value="">Select State</option>';

        states.forEach(state => {
            routeState.innerHTML += `
                <option value="${state}">
                    ${state}
                </option>
            `;
        });

        if (originInput) {
            originInput.readOnly = false;
        }
    }
}


/* =========================================================
   LOAD BUSES FOR ROUTE
   ========================================================= */

function loadRouteBuses() {

    const busSelect =
        document.getElementById("routeBusType");

    if (!busSelect) return;

    const buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    const routeState =
        document.getElementById("routeState");

    const selectedState =
        routeState?.value || "";

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let visibleBuses = buses;

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        visibleBuses =
            buses.filter(bus =>
                String(bus.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );

    } else if (selectedState) {

        visibleBuses =
            buses.filter(bus =>
                String(bus.state || "")
                    .trim()
                    .toLowerCase() ===
                String(selectedState)
                    .trim()
                    .toLowerCase()
            );
    }

    busSelect.innerHTML =
        `<option value="">Select Bus</option>`;

    visibleBuses.forEach(bus => {

        busSelect.innerHTML += `
            <option value="${bus.busNumber} - ${bus.busType}">
                ${bus.busNumber} - ${bus.busType}
            </option>
        `;

    });
}


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadStateForRoute();

    loadRouteBuses();

    const routeForm =
        document.getElementById("routeForm");

    if (!routeForm) return;

    loadRoutes();

    const routeState =
        document.getElementById("routeState");

    if (routeState) {

        routeState.addEventListener(
            "change",
            function () {

                loadRouteBuses();

                const busSelect =
                    document.getElementById("routeBusType");

                if (busSelect) {
                    busSelect.value = "";
                }
            }
        );
    }


    const searchRoute =
        document.getElementById("searchRoute");

    if (searchRoute) {

        searchRoute.addEventListener(
            "input",
            loadRoutes
        );
    }


    /* =====================================================
       SAVE ROUTE
       ===================================================== */

    routeForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const currentUser =
                JSON.parse(
                    localStorage.getItem("currentUser")
                );

            let routes =
                JSON.parse(
                    localStorage.getItem("routes")
                ) || [];


            const routeName =
                document
                    .getElementById("routeName")
                    .value
                    .trim();

            const origin =
                document
                    .getElementById("origin")
                    .value
                    .trim();

            const destination =
                document
                    .getElementById("destination")
                    .value
                    .trim();

            let state =
                document
                    .getElementById("routeState")
                    .value
                    .trim();

            const routeBusType =
                document
                    .getElementById("routeBusType")
                    .value;

            const fare =
                Number(
                    document
                        .getElementById("routeFare")
                        .value
                );


            /* STAFF MUST USE ASSIGNED STATE */

            if (
                currentUser &&
                currentUser.role === "staff"
            ) {

                state =
                    String(
                        currentUser.state || ""
                    ).trim();

                if (!state) {

                    alert(
                        "Your account does not have an assigned state."
                    );

                    return;
                }
            }

            /* ORIGIN MUST MATCH STAFF'S ASSIGNED STATE */

            if (
                currentUser &&
                currentUser.role === "staff"
            ) {
                const assignedState =
                    String(currentUser.state || "")
                        .trim()
                        .toLowerCase()
                        .replace(/\s+state$/i, "");

                const selectedOrigin =
                    String(origin || "")
                        .trim()
                        .toLowerCase()
                        .replace(/\s+state$/i, "");

                if (
                    !assignedState ||
                    selectedOrigin !== assignedState
                ) {
                    alert(
                        "Access Denied! Your route must originate from your assigned state."
                    );

                    return;
                }
            }

            /* ROUTE NAME MUST MATCH ORIGIN AND DESTINATION */

            const normalizedRouteName =
                routeName
                    .replace(/\s+/g, "")
                    .replace(/[–—]/g, "-")
                    .toLowerCase();

            const normalizedOrigin =
                origin
                    .replace(/\s+/g, "")
                    .toLowerCase();

            const normalizedDestination =
                destination
                    .replace(/\s+/g, "")
                    .toLowerCase();

            const validRouteName =
                `${normalizedOrigin}-${normalizedDestination}`;

            if (normalizedRouteName !== validRouteName) {
                alert(
                    "Invalid Route Name! The route name must match the selected Origin and Destination. Example: Lagos-Abuja."
                );
                return;
            }



            /* CHECK SELECTED BUS */

            const selectedBus =
                (
                    JSON.parse(
                        localStorage.getItem("buses")
                    ) || []
                ).find(bus =>
                    `${bus.busNumber} - ${bus.busType}` ===
                    routeBusType
                );


            if (!selectedBus) {

                alert(
                    "Please select a valid bus."
                );

                return;
            }


            /* BUS MUST BELONG TO SAME STATE */

            if (
                String(selectedBus.state || "")
                    .trim()
                    .toLowerCase() !==
                String(state)
                    .trim()
                    .toLowerCase()
            ) {

                alert(
                    "The selected bus does not belong to this state."
                );

                return;
            }


            /* STAFF CANNOT EDIT ANOTHER STATE */

            if (routeEditIndex !== -1) {

                const existingRoute =
                    routes[routeEditIndex];

                if (
                    currentUser &&
                    currentUser.role === "staff" &&
                    String(existingRoute.state || "")
                        .trim()
                        .toLowerCase() !==
                    String(currentUser.state || "")
                        .trim()
                        .toLowerCase()
                ) {

                    alert(
                        "Access Denied! You cannot edit a route outside your assigned state."
                    );

                    return;
                }
            }


            const route = {

                state,

                routeName,

                origin,

                destination,

                busType: routeBusType,

                fare,

                createdAt:
                    new Date().toLocaleString()
            };


            if (routeEditIndex === -1) {

                routes.push(route);

            } else {

                routes[routeEditIndex] =
                    route;

                routeEditIndex = -1;
            }


            document
                .querySelector("#routeForm button")
                .innerHTML =
                `<i class="fa-solid fa-plus"></i> Add Route`;


            localStorage.setItem(
                "routes",
                JSON.stringify(routes)
            );


            loadNotifyMessage(
                "route",
                {
                    route: route.routeName
                }
            );


            refreshDashboard();

            routeForm.reset();

            loadStateForRoute();

            loadRouteBuses();

            loadRoutes();
        }
    );
});


/* =========================================================
   LOAD ROUTES
   ========================================================= */

function loadRoutes() {

    const tableBody =
        document.getElementById(
            "routeTableBody"
        );

    if (!tableBody) return;

    tableBody.innerHTML = "";


    const routes =
        JSON.parse(
            localStorage.getItem("routes")
        ) || [];


    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    /* =====================================================
       FILTER BY STAFF STATE
       ===================================================== */

    let visibleRoutes =
        routes.map(
            (route, index) => ({
                route,
                originalIndex: index
            })
        );


    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        visibleRoutes =
            visibleRoutes.filter(item =>
                String(item.route.state || "")
                    .trim()
                    .toLowerCase() ===
                assignedState
            );
    }


    /* =====================================================
       UPDATE TOTAL ROUTES
       ===================================================== */

    const totalRoutes =
        document.getElementById(
            "totalRoutes"
        );

    if (totalRoutes) {

        totalRoutes.textContent =
            visibleRoutes.length;
    }


    /* =====================================================
       SEARCH
       ===================================================== */

    const searchValue =
        document
            .getElementById("searchRoute")
            ?.value
            .toLowerCase()
            .trim() || "";


    const filteredRoutes =
        visibleRoutes.filter(
            ({ route }) =>

                String(route.routeName || "")
                    .toLowerCase()
                    .includes(searchValue)

                ||

                String(route.origin || "")
                    .toLowerCase()
                    .includes(searchValue)

                ||

                String(route.destination || "")
                    .toLowerCase()
                    .includes(searchValue)

                ||

                String(route.busType || "")
                    .toLowerCase()
                    .includes(searchValue)

                ||

                String(route.state || "")
                    .toLowerCase()
                    .includes(searchValue)
        );


    /* =====================================================
       EMPTY STATE
       ===================================================== */

    if (filteredRoutes.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8"
                    style="text-align:center;">
                    No routes available
                </td>
            </tr>
        `;

        return;
    }


    /* =====================================================
       DISPLAY ROUTES
       ===================================================== */

    filteredRoutes.forEach(
        ({ route, originalIndex }) => {

            tableBody.innerHTML += `
                <tr>

                    <td data-label="State">
                        ${route.state || "Not Assigned"}
                    </td>

                    <td data-label="Route">
                        ${route.routeName}
                    </td>

                    <td data-label="Origin">
                        ${route.origin}
                    </td>

                    <td data-label="Destination">
                        ${route.destination}
                    </td>

                    <td data-label="Bus Type">
                        ${route.busType}
                    </td>

                    <td data-label="Ticket Price">
                        ₦${Number(route.fare || 0).toLocaleString()}
                    </td>

                    <td data-label="Date Time">
                        ${route.createdAt || "N/A"}
                    </td>

                    <td>

                        <button
                            onclick="editRoute(${originalIndex})"
                            class="edit-btn">
                            Edit
                        </button>

                        <button
                            onclick="deleteRoute(${originalIndex})"
                            class="delete-btn">
                            Delete
                        </button>

                    </td>

                </tr>
            `;
        }
    );
}


/* =========================================================
   DELETE ROUTE
   ========================================================= */

function deleteRoute(index) {

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    const routes =
        JSON.parse(
            localStorage.getItem("routes")
        ) || [];


    const route =
        routes[index];


    if (!route) return;


    /* STAFF STATE PROTECTION */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        const routeState =
            String(route.state || "")
                .trim()
                .toLowerCase();


        if (routeState !== assignedState) {

            alert(
                "Access Denied! You cannot delete a route outside your assigned state."
            );

            return;
        }
    }


    if (
        !confirm(
            "Are you sure you want to delete this route?"
        )
    ) {
        return;
    }


    routes.splice(index, 1);


    localStorage.setItem(
        "routes",
        JSON.stringify(routes)
    );


    refreshDashboard();

    loadRoutes();
}


/* =========================================================
   EDIT ROUTE
   ========================================================= */

function editRoute(index) {

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    const routes =
        JSON.parse(
            localStorage.getItem("routes")
        ) || [];


    const route =
        routes[index];


    if (!route) return;


    /* STAFF STATE PROTECTION */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        const routeState =
            String(route.state || "")
                .trim()
                .toLowerCase();


        if (routeState !== assignedState) {

            alert(
                "Access Denied! You cannot edit a route outside your assigned state."
            );

            return;
        }
    }


    document.getElementById(
        "routeName"
    ).value = route.routeName;


    document.getElementById(
        "origin"
    ).value = route.origin;


    document.getElementById(
        "destination"
    ).value = route.destination;


    document.getElementById(
        "routeState"
    ).value = route.state;


    loadRouteBuses();


    document.getElementById(
        "routeBusType"
    ).value = route.busType;


    document.getElementById(
        "routeFare"
    ).value = route.fare;


    routeEditIndex = index;


    document.querySelector(
        "#routeForm button"
    ).innerHTML =
        `<i class="fa-solid fa-pen"></i> Update Route`;
}
// let routeEditIndex = -1

// function loadStateForRoute() {
//     const routeState = document.getElementById("routeState");

//     if (!routeState) return;

//     let buses = JSON.parse(localStorage.getItem("buses")) || [];
//     const states = [...new Set(
//         buses.map(bus => bus.state)
//     )];

//     routeState.innerHTML = '<option value="">Select State</option>';
//     states.forEach(state => {
//         routeState.innerHTML += `
//             <option value="${state}">
//                 ${state}
//             </option>
//         `;
//     });

// }

// function loadRouteBuses() {
//     const busSelect = document.getElementById("routeBusType");

//     if (!busSelect) return;

//     busSelect.innerHTML = `<option value="">Select Bus</option>`;

//     const buses = JSON.parse(localStorage.getItem("buses")) || [];

//     buses.forEach(bus => {
//         busSelect.innerHTML += `
//             <option value="${bus.busNumber} - ${bus.busType}">
//                 ${bus.busNumber} - ${bus.busType}
//             </option>
//         `;
//     });
// }

// document.addEventListener("DOMContentLoaded", () => {
//     loadRouteBuses();
//     const routeForm = document.getElementById("routeForm");

//     if (!routeForm) return;

//     loadRoutes();
//     loadStateForRoute();


//     const searchRoute = document.getElementById("searchRoute");

//     if (searchRoute) {
//         searchRoute.addEventListener("input", loadRoutes);
//     }

//     routeForm.addEventListener("submit", function (event) {
//         event.preventDefault();


//         const routeName = document.getElementById("routeName").value;
//         const origin = document.getElementById("origin").value;
//         const destination = document.getElementById("destination").value;
//         const state = document.getElementById("routeState").value;
//         const routeBusType = document.getElementById("routeBusType").value;




//         const route = {
//             state,
//             routeName,
//             origin,
//             destination,
//             busType: routeBusType,
//             fare: Number(document.getElementById("routeFare").value),
//             createdAt: new Date().toLocaleString()
//         }

//         let routes = JSON.parse(localStorage.getItem("routes")) || [];

//         if (routeEditIndex === -1) {
//             routes.push(route);
//         } else {
//             routes[routeEditIndex] = route;

//             routeEditIndex = -1;
//         }

//         document.querySelector("#routeForm button").textContent = "Add Route";

//         localStorage.setItem("routes", JSON.stringify(routes));
//         loadNotifyMessage("route", { route: route.routeName });

//         refreshDashboard();
//         routeForm.reset();
//         loadRoutes();
//     }
//     );

// });

// function loadRoutes() {
//     const tableBody = document.getElementById("routeTableBody");

//     if (!tableBody) return;

//     tableBody.innerHTML = "";

//     let routes = JSON.parse(localStorage.getItem("routes")) || [];

//     document.getElementById("totalRoutes").textContent = routes.length;

//     if (routes.length === 0) {
//         tableBody.innerHTML = `
//         <tr>
//             <td colspan="6" style="text-align:center;">
//                 No routes available
//             </td>
//         </tr>
//         `;

//         return;
//     }

//     const searchValue = document.getElementById("searchRoute")?.value.toLowerCase() || "";

//     routes
//         .filter(route =>
//             route.routeName.toLowerCase().includes(searchValue) ||
//             route.origin.toLowerCase().includes(searchValue) ||
//             route.destination.toLowerCase().includes(searchValue)
//         )
//         .forEach(route => {

//             const originalIndex = routes.indexOf(route);
//             tableBody.innerHTML += `
//         <tr>
//            <td data-label="State">${route.state}</td>
//            <td data-label="Route">${route.routeName}</td>
//            <td data-label="Origin">${route.origin}</td>
//            <td data-label="Destination">${route.destination}</td>
//            <td data-label="Bus Type">${route.busType}</td>
//            <td data-label="Ticket Price">${route.fare}</td>
//            <td data-label="Date Time">${route.createdAt || "N/A"}</td>
//            <td>
//                 <button onclick="editRoute(${originalIndex})"
//                 class="edit-btn">
//                     Edit
//                 </button>

//                 <button onclick="deleteRoute(${originalIndex})"
//                 class="delete-btn">
//                     Delete
//                 </button>
//             <td>
//         </tr>
//         `;
//         });
// }

// function deleteRoute(index) {
//     if (!confirm("Are you sure you want to delete this route?")) {
//         return;
//     }

//     let routes = JSON.parse(localStorage.getItem("routes")) || [];

//     routes.splice(index, 1);

//     localStorage.setItem("routes", JSON.stringify(routes));

//     refreshDashboard();
//     loadRoutes();
// }

// function editRoute(index) {

//     let routes = JSON.parse(localStorage.getItem("routes")) || [];

//     const route = routes[index];

//     document.getElementById("routeName").value = route.routeName;
//     document.getElementById("origin").value = route.origin;
//     document.getElementById("destination").value = route.destination;
//     document.getElementById("routeState").value = route.state;
//     document.getElementById("routeBusType").value = route.busType;
//     document.getElementById("routeFare").value = route.fare;

//     routeEditIndex = index;

//     document.querySelector("#routeForm button").textContent = "Update Route";

// }


//=====================
//Schedule Section
//====================

let scheduleEditIndex = -1;

function to12Hour(time24h) {
    if (!time24h) return "";

    let [hours, minutes] = time24h.split(':');
    hours = parseInt(hours, 10);

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${hours}:${minutes}${ampm}`;
}

function getStatusWithEmoji(status) {
    switch (status) {
        case "Scheduled":
            return "🟢 Scheduled";

        case "Boarding":
            return "🔵 Boarding";

        case "Delayed":
            return "🟡 Delayed";

        case "Departed":
            return "🔴 Departed";

        case "Cancelled":
            return "❌ Cancelled";

        default:
            return status;
    }
}


/* =========================================================
   LOAD SCHEDULE STATES
   ========================================================= */

function loadScheduleState() {

    const stateSelect =
        document.getElementById("scheduleState");

    if (!stateSelect) return;

    const buses =
        JSON.parse(
            localStorage.getItem("buses")
        ) || [];

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );

    let states = [
        ...new Set(
            buses
                .map(bus => bus.state)
                .filter(state => state)
        )
    ];

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(currentUser.state || "")
                .trim();

        stateSelect.innerHTML = `
            <option value="${assignedState}">
                ${assignedState}
            </option>
        `;

        stateSelect.value = assignedState;
        stateSelect.disabled = true;

    } else {

        stateSelect.disabled = false;

        stateSelect.innerHTML =
            '<option value="">Select State</option>';

        states.forEach(state => {

            stateSelect.innerHTML += `
                <option value="${state}">
                    ${state}
                </option>
            `;

        });
    }
}


/* =========================================================
   LOAD SCHEDULE BUSES
   ========================================================= */

function loadScheduleBuses() {

    const state =
        document.getElementById("scheduleState")?.value;

    const busSelect =
        document.getElementById("busNumber");

    if (!busSelect) return;

    busSelect.innerHTML =
        '<option value="">Select Bus</option>';

    const buses =
        JSON.parse(
            localStorage.getItem("buses")
        ) || [];

    const schedules =
        JSON.parse(
            localStorage.getItem("schedules")
        ) || [];

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    function normalizeBus(value) {

        return String(value || "")
            .replace(/\s+/g, "")
            .toLowerCase();
    }


    let visibleBuses = buses;


    /*
     * STAFF CAN ONLY SEE BUSES
     * FROM THEIR ASSIGNED STATE
     */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        visibleBuses =
            visibleBuses.filter(bus =>
                String(bus.state || "")
                    .trim()
                    .toLowerCase() ===
                assignedState
            );

    } else if (state) {

        visibleBuses =
            visibleBuses.filter(bus =>
                String(bus.state || "")
                    .trim()
                    .toLowerCase() ===
                String(state)
                    .trim()
                    .toLowerCase()
            );
    }


    /*
     * REMOVE BUSES CURRENTLY IN TRANSIT
     */

    visibleBuses =
        visibleBuses.filter(
            bus =>
                bus.movementStatus !== "In Transit"
        );


    /*
     * REMOVE BUSES THAT ALREADY HAVE
     * ANOTHER FUTURE ACTIVE SCHEDULE
     */

    visibleBuses =
        visibleBuses.filter(bus => {

            const busKey =
                normalizeBus(
                    `${bus.busNumber}-${bus.busType}`
                );
            const activeSchedule =
                schedules.find((schedule, index) => {

                    const scheduleBus =
                        normalizeBus(
                            schedule.busNumber
                        );

                    if (
                        scheduleBus !== busKey
                    ) {
                        return false;
                    }

                    /*
                     * ALLOW THE SCHEDULE CURRENTLY
                     * BEING EDITED
                     */

                    if (
                        index === scheduleEditIndex
                    ) {
                        return false;
                    }

                    if (
                        schedule.status === "Departed" ||
                        schedule.status === "Cancelled"
                    ) {
                        return false;
                    }

                    if (
                        !schedule.departureDate ||
                        !schedule.departureTime
                    ) {
                        return false;
                    }

                    const scheduleDateTime =
                        new Date(
                            `${schedule.departureDate}T${schedule.departureTime}`
                        );

                    return (
                        scheduleDateTime > new Date()
                    );
                });

            return !activeSchedule;
        });


    visibleBuses.forEach(bus => {

        const busValue =
            `${bus.busNumber} - ${bus.busType}`;

        busSelect.innerHTML += `
            <option value="${busValue}">
                ${busValue}
            </option>
        `;
    });
}


/* =========================================================
   LOAD ROUTES FOR SELECTED BUS
   ========================================================= */

function loadScheduleRoutes() {

    const selectedBus =
        document.getElementById("busNumber")?.value;

    const routeSelect =
        document.getElementById("routeName");

    if (!routeSelect) return;

    routeSelect.innerHTML =
        '<option value="">Select Route</option>';

    const routes =
        JSON.parse(
            localStorage.getItem("routes")
        ) || [];

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );

    const selectedState =
        document.getElementById("scheduleState")?.value || "";


    let visibleRoutes = routes;


    /*
     * STAFF CAN ONLY SEE ROUTES
     * FROM THEIR ASSIGNED STATE
     */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        visibleRoutes =
            visibleRoutes.filter(route =>
                String(route.state || "")
                    .trim()
                    .toLowerCase() ===
                assignedState
            );

    } else if (selectedState) {

        visibleRoutes =
            visibleRoutes.filter(route =>
                String(route.state || "")
                    .trim()
                    .toLowerCase() ===
                String(selectedState)
                    .trim()
                    .toLowerCase()
            );
    }


    /*
     * ONLY ROUTES ASSIGNED TO SELECTED BUS
     */

    visibleRoutes =
        visibleRoutes.filter(
            route =>
                route.busType === selectedBus
        );


    visibleRoutes.forEach(route => {

        routeSelect.innerHTML += `
            <option value="${route.routeName}">
                ${route.routeName}
            </option>
        `;
    });
}


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const scheduleForm =
        document.getElementById("scheduleForm");

    if (!scheduleForm) return;


    loadScheduleState();

    loadScheduleBuses();

    updateSchedulingStatus();

    loadSchedules();


    const scheduleState =
        document.getElementById("scheduleState");

    if (scheduleState) {

        scheduleState.addEventListener(
            "change",
            function () {

                loadScheduleBuses();

                const busSelect =
                    document.getElementById("busNumber");

                const routeSelect =
                    document.getElementById("routeName");

                if (busSelect) {
                    busSelect.value = "";
                }

                if (routeSelect) {
                    routeSelect.innerHTML =
                        '<option value="">Select Route</option>';
                }
            }
        );
    }


    const busNumber =
        document.getElementById("busNumber");

    if (busNumber) {

        busNumber.addEventListener(
            "change",
            function () {

                loadScheduleRoutes();
            }
        );
    }


    const searchSchedule =
        document.getElementById("searchSchedule");

    if (searchSchedule) {

        searchSchedule.addEventListener(
            "input",
            loadSchedules
        );
    }


    /* =====================================================
       SAVE SCHEDULE
       ===================================================== */

    scheduleForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const currentUser =
                JSON.parse(
                    localStorage.getItem("currentUser")
                );


            let schedules =
                JSON.parse(
                    localStorage.getItem("schedules")
                ) || [];


            let scheduleState =
                document
                    .getElementById("scheduleState")
                    .value
                    .trim();


            const busNumber =
                document
                    .getElementById("busNumber")
                    .value;


            const routeName =
                document
                    .getElementById("routeName")
                    .value;


            const departureDate =
                document
                    .getElementById("departureDate")
                    .value;


            const departureTime =
                document
                    .getElementById("departureTime")
                    .value;


            const expectedArrivalDate =
                document
                    .getElementById("expectedArrivalDate")
                    .value;


            const expectedArrivalTime =
                document
                    .getElementById("expectedArrivalTime")
                    .value;


            /*
             * STAFF MUST USE ASSIGNED STATE
             */

            if (
                currentUser &&
                currentUser.role === "staff"
            ) {

                scheduleState =
                    String(
                        currentUser.state || ""
                    ).trim();

                if (!scheduleState) {

                    alert(
                        "Your account does not have an assigned state."
                    );

                    return;
                }
            }


            /*
             * VERIFY BUS BELONGS TO STATE
             */

            const buses =
                JSON.parse(
                    localStorage.getItem("buses")
                ) || [];


            const selectedBus =
                buses.find(bus =>
                    `${bus.busNumber} - ${bus.busType}` ===
                    busNumber
                );


            if (!selectedBus) {

                alert(
                    "Please select a valid bus."
                );

                return;
            }


            if (
                String(selectedBus.state || "")
                    .trim()
                    .toLowerCase() !==
                String(scheduleState)
                    .trim()
                    .toLowerCase()
            ) {

                alert(
                    "The selected bus does not belong to this state."
                );

                return;
            }


            /*
             * VERIFY ROUTE BELONGS TO STATE
             */

            const routes =
                JSON.parse(
                    localStorage.getItem("routes")
                ) || [];


            const selectedRoute =
                routes.find(route =>
                    route.routeName === routeName &&
                    route.busType === busNumber
                );


            if (!selectedRoute) {

                alert(
                    "Please select a valid route for this bus."
                );

                return;
            }


            if (
                String(selectedRoute.state || "")
                    .trim()
                    .toLowerCase() !==
                String(scheduleState)
                    .trim()
                    .toLowerCase()
            ) {

                alert(
                    "The selected route does not belong to this state."
                );

                return;
            }


            /*
             * PREVENT PAST DEPARTURE
             */

            const selectedDateTime =
                new Date(
                    `${departureDate}T${departureTime}`
                );

            const now = new Date();


            if (
                selectedDateTime < now
            ) {

                alert(
                    "You cannot schedule a bus in the past."
                );

                return;
            }


            /*
             * VALIDATE ARRIVAL
             */

            const expectedArrivalDateTime =
                new Date(
                    `${expectedArrivalDate}T${expectedArrivalTime}`
                );


            if (
                isNaN(
                    expectedArrivalDateTime.getTime()
                )
            ) {

                alert(
                    "Please provide a valid expected arrival date and time."
                );

                return;
            }


            if (
                expectedArrivalDateTime <=
                selectedDateTime
            ) {

                alert(
                    "Expected arrival must be after the departure date and time."
                );

                return;
            }


            /*
             * PREVENT DUPLICATE SCHEDULE
             */

            const duplicateSchedule =
                schedules.some(
                    (schedule, index) =>

                        schedule.busNumber ===
                        busNumber &&

                        schedule.departureDate ===
                        departureDate &&

                        schedule.departureTime ===
                        departureTime &&

                        index !==
                        scheduleEditIndex
                );


            if (duplicateSchedule) {

                alert(
                    "This bus already has a schedule for this date and time."
                );

                return;
            }


            /*
             * STAFF CANNOT EDIT ANOTHER STATE
             */

            if (
                scheduleEditIndex !== -1
            ) {

                const existingSchedule =
                    schedules[scheduleEditIndex];


                if (
                    currentUser &&
                    currentUser.role === "staff" &&
                    String(
                        existingSchedule.state || ""
                    )
                        .trim()
                        .toLowerCase() !==
                    String(
                        currentUser.state || ""
                    )
                        .trim()
                        .toLowerCase()
                ) {

                    alert(
                        "Access Denied! You cannot edit a schedule outside your assigned state."
                    );

                    return;
                }
            }


            const schedule = {

                state:
                    scheduleState,

                busNumber,

                routeName,

                departureDate,

                departureTime,

                expectedArrivalDate,

                expectedArrivalTime,

                status:
                    "Scheduled",

                manualStatus:
                    false,

                createdAt:
                    new Date().toLocaleString()
            };


            if (
                scheduleEditIndex === -1
            ) {

                schedules.push(schedule);

            } else {

                schedules[
                    scheduleEditIndex
                ] = schedule;

                scheduleEditIndex = -1;
            }


            document
                .querySelector(
                    "#scheduleForm button"
                )
                .innerHTML =
                `<i class="fa-solid fa-calendar-plus"></i> Add Schedule`;


            localStorage.setItem(
                "schedules",
                JSON.stringify(schedules)
            );


            loadNotifyMessage(
                "schedule",
                {
                    route:
                        schedule.routeName
                }
            );


            refreshDashboard();

            scheduleForm.reset();

            loadScheduleState();

            loadScheduleBuses();

            loadSchedules();
        }
    );
});


/* =========================================================
   LOAD SCHEDULES
   ========================================================= */

function loadSchedules() {

    updateSchedulingStatus();


    const tableBody =
        document.getElementById(
            "scheduleTableBody"
        );


    if (!tableBody) return;

    tableBody.innerHTML = "";


    const allSchedules =
        JSON.parse(
            localStorage.getItem("schedules")
        ) || [];


    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    /*
     * KEEP ONLY ACTIVE SCHEDULES
     */

    let visibleSchedules =
        allSchedules
            .map(
                (schedule, index) => ({
                    schedule,
                    originalIndex: index
                })
            )
            .filter(
                ({ schedule }) =>
                    ![
                        "Departed",
                        "Cancelled"
                    ].includes(
                        schedule.status
                    )
            );


    /*
     * FILTER BY STAFF STATE
     */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(
                currentUser.state || ""
            )
                .trim()
                .toLowerCase();


        visibleSchedules =
            visibleSchedules.filter(
                ({ schedule }) =>
                    String(
                        schedule.state || ""
                    )
                        .trim()
                        .toLowerCase() ===
                    assignedState
            );
    }


    /*
     * UPDATE TOTAL SCHEDULES
     */

    const totalSchedules =
        document.getElementById(
            "totalSchedules"
        );


    if (totalSchedules) {

        totalSchedules.textContent =
            visibleSchedules.length;
    }


    /*
     * SEARCH
     */

    const searchValue =
        document
            .getElementById(
                "searchSchedule"
            )
            ?.value
            .toLowerCase()
            .trim() || "";


    const filteredSchedules =
        visibleSchedules.filter(
            ({ schedule }) =>

                String(
                    schedule.busNumber || ""
                )
                    .toLowerCase()
                    .includes(searchValue)

                ||

                String(
                    schedule.routeName || ""
                )
                    .toLowerCase()
                    .includes(searchValue)

                ||

                String(
                    schedule.state || ""
                )
                    .toLowerCase()
                    .includes(searchValue)
        );


    /*
     * EMPTY STATE
     */

    if (
        filteredSchedules.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9"
                    style="text-align:center;">
                    No schedules available
                </td>
            </tr>
        `;

        return;
    }


    /*
     * DISPLAY SCHEDULES
     */

    filteredSchedules.forEach(
        ({
            schedule,
            originalIndex
        }) => {

            tableBody.innerHTML += `
                <tr>

                    <td data-label="Schedule State">
                        ${schedule.state || "Not Assigned"}
                    </td>

                    <td data-label="Bus Number">
                        ${schedule.busNumber}
                    </td>

                    <td data-label="Route Name">
                        ${schedule.routeName}
                    </td>

                    <td data-label="Departure Date">
                        ${schedule.departureDate}
                    </td>

                    <td data-label="Departure Time">
                        ${to12Hour(
                schedule.departureTime
            )}
                    </td>

                    <td data-label="Expected Arrival">
                        ${schedule.expectedArrivalDate
                    ? `${schedule.expectedArrivalDate} ${to12Hour(schedule.expectedArrivalTime)}`
                    : "N/A"
                }
                    </td>

                    <td data-label="Status">
                        ${getStatusWithEmoji(
                    schedule.status
                )}
                    </td>

                    <td data-label="Date Time">
                        ${schedule.createdAt || "N/A"}
                    </td>

                    <td>

                        <button
                            onclick="editSchedules(${originalIndex})"
                            class="edit-btn">
                            Edit
                        </button>

                        <button
                            onclick="cancelSchedules(${originalIndex})"
                            class="delete-btn">
                            Cancel
                        </button>

                        <button
                            onclick="changeScheduleStatus(${originalIndex})"
                            class="status-btn">
                            Status
                        </button>

                    </td>

                </tr>
            `;
        }
    );
}


/* =========================================================
   AUTOMATIC SCHEDULE STATUS
   ========================================================= */

function updateSchedulingStatus() {

    let schedules =
        JSON.parse(
            localStorage.getItem("schedules")
        ) || [];


    const now = new Date();


    schedules.forEach(schedule => {

        if (schedule.manualStatus) {
            return;
        }


        const departure =
            new Date(
                schedule.departureDate +
                "T" +
                schedule.departureTime
            );


        const boardingTime =
            new Date(
                departure.getTime() -
                (30 * 60 * 1000)
            );


        if (
            now >= departure
        ) {

            if (
                schedule.status !==
                "Departed"
            ) {

                loadNotifyMessage(
                    "departed",
                    {
                        busNumber:
                            schedule.busNumber
                    }
                );
            }


            schedule.status =
                "Departed";

        }

        else if (
            now >= boardingTime
        ) {

            if (
                schedule.status !==
                "Boarding"
            ) {

                loadNotifyMessage(
                    "boarding",
                    {
                        busNumber:
                            schedule.busNumber
                    }
                );
            }


            schedule.status =
                "Boarding";

        }

        else {

            schedule.status =
                "Scheduled";
        }
    });


    localStorage.setItem(
        "schedules",
        JSON.stringify(schedules)
    );
}


/* =========================================================
   EDIT SCHEDULE
   ========================================================= */
function editSchedules(index) {

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    const schedules =
        JSON.parse(
            localStorage.getItem("schedules")
        ) || [];


    const schedule =
        schedules[index];


    if (!schedule) return;


    /*
     * STAFF STATE PROTECTION
     */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(
                currentUser.state || ""
            )
                .trim()
                .toLowerCase();


        const scheduleState =
            String(
                schedule.state || ""
            )
                .trim()
                .toLowerCase();


        if (
            scheduleState !==
            assignedState
        ) {

            alert(
                "Access Denied! You cannot edit a schedule outside your assigned state."
            );

            return;
        }
    }


    /*
     * MARK THIS SCHEDULE AS THE
     * SCHEDULE CURRENTLY BEING EDITED
     */

    scheduleEditIndex =
        index;


    /*
     * SET STATE FIRST
     */

    document.getElementById(
        "scheduleState"
    ).value =
        schedule.state;


    /*
     * LOAD AVAILABLE BUSES
     */

    loadScheduleBuses();


    /*
     * SELECT THE EXISTING BUS
     */

    document.getElementById(
        "busNumber"
    ).value =
        schedule.busNumber;


    /*
     * LOAD ROUTES FOR THE EXISTING BUS
     */

    loadScheduleRoutes();


    /*
     * SELECT THE EXISTING ROUTE
     */

    document.getElementById(
        "routeName"
    ).value =
        schedule.routeName;


    /*
     * LOAD DEPARTURE DETAILS
     */

    document.getElementById(
        "departureDate"
    ).value =
        schedule.departureDate;


    document.getElementById(
        "departureTime"
    ).value =
        schedule.departureTime;


    /*
     * LOAD ARRIVAL DETAILS
     */

    document.getElementById(
        "expectedArrivalDate"
    ).value =
        schedule.expectedArrivalDate || "";


    document.getElementById(
        "expectedArrivalTime"
    ).value =
        schedule.expectedArrivalTime || "";


    /*
     * CHANGE BUTTON TO UPDATE
     */

    document.querySelector(
        "#scheduleForm button"
    ).innerHTML =
        `<i class="fa-solid fa-pen"></i> Update Schedule`;
}


/* =========================================================
   CANCEL SCHEDULE
   ========================================================= */

function cancelSchedules(index) {

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    let schedules =
        JSON.parse(
            localStorage.getItem("schedules")
        ) || [];


    const schedule =
        schedules[index];


    if (!schedule) return;


    /*
     * STAFF STATE PROTECTION
     */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(
                currentUser.state || ""
            )
                .trim()
                .toLowerCase();


        const scheduleState =
            String(
                schedule.state || ""
            )
                .trim()
                .toLowerCase();


        if (
            scheduleState !==
            assignedState
        ) {

            alert(
                "Access Denied! You cannot cancel a schedule outside your assigned state."
            );

            return;
        }
    }


    if (
        !confirm(
            "Cancel this schedule?"
        )
    ) {
        return;
    }


    schedules[index].status =
        "Cancelled";

    schedules[index].manualStatus =
        true;


    localStorage.setItem(
        "schedules",
        JSON.stringify(schedules)
    );


    refreshDashboard();


    if (
        typeof loadDashboardStats ===
        "function"
    ) {

        loadDashboardStats();
    }


    if (
        typeof loadReports ===
        "function"
    ) {

        loadReports();
    }


    updateSchedulingStatus();

    loadSchedules();
}


/* =========================================================
   CHANGE SCHEDULE STATUS
   ========================================================= */

function changeScheduleStatus(index) {

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    let schedules =
        JSON.parse(
            localStorage.getItem("schedules")
        ) || [];


    const schedule =
        schedules[index];


    if (!schedule) return;


    /*
     * STAFF STATE PROTECTION
     */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(
                currentUser.state || ""
            )
                .trim()
                .toLowerCase();


        const scheduleState =
            String(
                schedule.state || ""
            )
                .trim()
                .toLowerCase();


        if (
            scheduleState !==
            assignedState
        ) {

            alert(
                "Access Denied! You cannot change the status of a schedule outside your assigned state."
            );

            return;
        }
    }


    const newStatus =
        prompt(
            "Enter status: \nScheduled\nBoarding\nDelayed\nDeparted\nCancelled"
        );


    if (!newStatus) return;


    const allowedStatuses = [
        "Scheduled",
        "Boarding",
        "Delayed",
        "Departed",
        "Cancelled"
    ];


    if (
        !allowedStatuses.includes(
            newStatus
        )
    ) {

        alert(
            "Invalid status."
        );

        return;
    }


    schedules[index].status =
        newStatus;


    switch (newStatus) {

        case "Delayed":

            loadNotifyMessage(
                "delayed",
                {
                    busNumber:
                        schedules[index]
                            .busNumber
                }
            );

            break;


        case "Cancelled":

            loadNotifyMessage(
                "cancel",
                {
                    busNumber:
                        schedules[index]
                            .busNumber
                }
            );

            break;
    }


    if (
        newStatus === "Delayed" ||
        newStatus === "Cancelled"
    ) {

        schedules[index].manualStatus =
            true;

    } else {

        schedules[index].manualStatus =
            false;
    }


    localStorage.setItem(
        "schedules",
        JSON.stringify(schedules)
    );


    refreshDashboard();


    if (
        typeof loadDashboardStats ===
        "function"
    ) {

        loadDashboardStats();
    }


    if (
        typeof loadReports ===
        "function"
    ) {

        loadReports();
    }


    updateSchedulingStatus();

    loadSchedules();
}
// let scheduleEditIndex = -1;

// function to12Hour(time24h) {
//     if (!time24h) return "";

//     let [hours, minutes] = time24h.split(':');
//     hours = parseInt(hours, 10);

//     const ampm = hours >= 12 ? 'PM' : 'AM';
//     hours = hours % 12 || 12;
//     return `${hours}:${minutes}${ampm}`;
// }

// function getStatusWithEmoji(status) {
//     switch (status) {
//         case "Scheduled":
//             return " Scheduled";

//         case "Boarding":
//             return " Boarding";

//         case "Delayed":
//             return " Delayed";

//         case "Departed":
//             return " Departed";

//         case "Cancelled":
//             return " Cancelled";

//         default:
//             return status;
//     }
// }

// function loadScheduleState() {
//     const states = [...new Set(
//         JSON.parse(localStorage.getItem("buses") || "[]").map(bus => bus.state)
//     )];

//     const stateSelect = document.getElementById("scheduleState");

//     stateSelect.innerHTML = '<option value="">Select State</option>';
//     states.forEach(state => {
//         stateSelect.innerHTML += `
//             <option value="${state}">${state}</option>`;
//     });

// }


// function loadScheduleBuses() {

//     const state =
//         document.getElementById("scheduleState").value;

//     const busSelect =
//         document.getElementById("busNumber");

//     if (!busSelect) return;

//     busSelect.innerHTML =
//         '<option value="">Select Bus</option>';

//     let buses =
//         JSON.parse(localStorage.getItem("buses")) || [];

//     let schedules =
//         JSON.parse(localStorage.getItem("schedules")) || [];


//     /*
//      * Normalize bus values so:
//      *
//      * B001 - Luxury
//      *
//      * and
//      *
//      * B001-Luxury
//      *
//      * are treated as the same bus.
//      */
//     function normalizeBus(value) {

//         return String(value || "")
//             .replace(/\s+/g, "")
//             .toLowerCase();

//     }


//     /*
//      * Only buses physically located at the
//      * selected terminal are considered.
//      */
//     buses
//         .filter(bus => {

//             if (bus.state !== state) {
//                 return false;
//             }


//             /*
//              * A bus currently travelling to another
//              * terminal must not be available here.
//              */
//             if (bus.movementStatus === "In Transit") {
//                 return false;
//             }


//             /*
//              * Check whether this bus already has
//              * another future active schedule.
//              */
//             const busKey =
//                 normalizeBus(
//                     `${bus.busNumber}-${bus.busType}`
//                 );


//             const activeSchedule =
//                 schedules.find(schedule => {

//                     const scheduleBus =
//                         normalizeBus(schedule.busNumber);


//                     if (scheduleBus !== busKey) {
//                         return false;
//                     }


//                     /*
//                      * Departed and cancelled schedules
//                      * should not block a bus.
//                      */
//                     if (
//                         schedule.status === "Departed" ||
//                         schedule.status === "Cancelled"
//                     ) {
//                         return false;
//                     }


//                     if (
//                         !schedule.departureDate ||
//                         !schedule.departureTime
//                     ) {
//                         return false;
//                     }


//                     const scheduleDateTime =
//                         new Date(
//                             `${schedule.departureDate}T${schedule.departureTime}`
//                         );


//                     return scheduleDateTime > new Date();

//                 });


//             /*
//              * If the bus already has a future schedule,
//              * do not show it as available.
//              */
//             return !activeSchedule;

//         })
//         .forEach(bus => {

//             const busValue =
//                 `${bus.busNumber} - ${bus.busType}`;

//             busSelect.innerHTML += `
//                 <option value="${busValue}">
//                     ${busValue}
//                 </option>
//             `;

//         });

// }

// function loadScheduleRoutes() {
//     const selectedBus = document.getElementById("busNumber").value;
//     const routeSelect = document.getElementById("routeName");

//     routeSelect.innerHTML = '<option value="">Select Route</option>';

//     let routes = JSON.parse(localStorage.getItem("routes")) || [];

//     routes
//         .filter(route => route.busType === selectedBus)
//         .forEach(route => {
//             routeSelect.innerHTML += `
//                 <option value="${route.routeName}">
//                     ${route.routeName}
//                 </option>
//             `;
//         });
// }



// document.addEventListener("DOMContentLoaded", () => {
//     const scheduleForm = document.getElementById("scheduleForm");

//     if (!scheduleForm) return;

//     loadScheduleState();
//     updateSchedulingStatus();
//     loadSchedules();

//     document.getElementById("scheduleState").addEventListener("change", function () {
//         loadScheduleBuses();
//     });

//     document.getElementById("busNumber").addEventListener("change", function () {
//         loadScheduleRoutes();
//     })

//     const searchSchedule = document.getElementById("searchSchedule");

//     if (searchSchedule) {
//         searchSchedule.addEventListener("input", loadSchedules);
//     }

//     scheduleForm.addEventListener("submit", function (event) {
//         event.preventDefault();

//         const scheduleState = document.getElementById("scheduleState").value;
//         const busNumber = document.getElementById("busNumber").value;
//         const routeName = document.getElementById("routeName").value;
//         const departureDate = document.getElementById("departureDate").value;
//         let departureTime = document.getElementById("departureTime").value;
//         const expectedArrivalDate = document.getElementById("expectedArrivalDate").value;
//         const expectedArrivalTime = document.getElementById("expectedArrivalTime").value;

//         const selectedDateTime = new Date(`${departureDate}T${departureTime}`);
//         const now = new Date();
//         if (selectedDateTime < now) {
//             alert("You cannot schedule a bus in the past.");
//             return;
//         }

//         const expectedArrivalDateTime = new Date(
//             `${expectedArrivalDate}T${expectedArrivalTime}`
//         );

//         if (isNaN(expectedArrivalDateTime.getTime())) {
//             alert("Please provide a valid expected arrival date and time.");
//             return;
//         }

//         if (expectedArrivalDateTime <= selectedDateTime) {
//             alert("Expected arrival must be after the departure date and time.");
//             return;
//         }

//         let schedules = JSON.parse(localStorage.getItem("schedules")) || [];
//         const dublicateSchedule = schedules.some(
//             (schedule, index) =>
//                 schedule.busNumber === busNumber &&
//                 schedule.departureDate === departureDate &&
//                 schedule.departureTime === departureTime &&
//                 index !== scheduleEditIndex
//         );
//         if (dublicateSchedule) {
//             alert("this bus already has a schedule for this date and time.");
//             return;
//         }


//         const schedule = {
//             state: scheduleState,
//             busNumber,
//             routeName,
//             departureDate,
//             departureTime,
//             expectedArrivalDate,
//             expectedArrivalTime,
//             status: "Scheduled",
//             manualStatus: false,
//             createdAt: new Date().toLocaleString()
//         }



//         if (scheduleEditIndex === -1) {
//             schedules.push(schedule);
//         } else {
//             schedules[scheduleEditIndex] = schedule;

//             scheduleEditIndex = -1;

//             document.querySelector("#scheduleForm button").textContent = "Add Schedule";
//         }

//         localStorage.setItem("schedules", JSON.stringify(schedules));
//         loadNotifyMessage("schedule", { route: schedule.routeName });
//         refreshDashboard();

//         scheduleForm.reset();

//         loadSchedules();
//     });
// });

// function loadSchedules() {
//     updateSchedulingStatus();

//     const tableBody = document.getElementById("scheduleTableBody");

//     if (!tableBody) return;

//     tableBody.innerHTML = "";

//     let schedules = JSON.parse(localStorage.getItem("schedules")) || [];

//     schedules = schedules.filter(schedule =>
//         !["Departed", "Cancelled"].includes(schedule.status)
//     );

//     document.getElementById("totalSchedules").textContent = schedules.length;

//     if (schedules.length === 0) {
//         tableBody.innerHTML = `
//         <tr>
//             <td colspan="9" style="text-align:center;">
//                 No schedules available
//             </td>
//         </tr>
//         `;

//         return;
//     }

//     const searchValue = document.getElementById(
//         "searchSchedule"
//     )?.value.toLowerCase() || "";

//     schedules
//         .filter(schedule =>
//             schedule.busNumber.toLowerCase().includes(searchValue) ||
//             schedule.routeName.toLowerCase().includes(searchValue)
//         )
//         .forEach(schedule => {

//             const originalIndex = JSON.parse(localStorage.getItem("schedules"))
//                 .findIndex(s =>
//                     s.busNumber === schedule.busNumber &&
//                     s.routeName === schedule.routeName &&
//                     s.departureDate === schedule.departureDate &&
//                     s.departureTime === schedule.departureTime
//                 );
//             tableBody.innerHTML += `
//     <tr>
//         <td data-label="Schedule State">${schedule.state}</td>
//         <td data-label="Bus Number">${schedule.busNumber}</td>
//         <td data-label="Route Name">${schedule.routeName}</td>
//         <td data-label="Departure Date">${schedule.departureDate}</td>
//         <td data-label="Departure Time">${to12Hour(schedule.departureTime)}</td>
//         <td data-label="Expected Arrival">
//     ${schedule.expectedArrivalDate
//                     ? `${schedule.expectedArrivalDate} ${to12Hour(schedule.expectedArrivalTime)}`
//                     : "N/A"}
//         </td>
//         <td data-label="Status">${getStatusWithEmoji(schedule.status)}</td>
//         <td data-label="Date Time">${schedule.createdAt}</td>

//         <td>
//             <button onclick="editSchedules(${originalIndex})"
//             class="edit-btn">
//                 Edit
//             </button>

//             <button onclick="cancelSchedules(${originalIndex})"
//             class="delete-btn">
//                 Cancel
//             </button>

//               <button onclick="changeScheduleStatus(${originalIndex})" 
//               class="status-btn">
//                 Status
//             </button>
//         </td>
//     </tr>
//     `;
//         });
// }

// function updateSchedulingStatus() {
//     let schedules = JSON.parse(localStorage.getItem("schedules")) || [];

//     const now = new Date();
//     schedules.forEach(schedule => {
//         if (schedule.manualStatus) {
//             return;
//         }

//         const departure = new Date(
//             schedule.departureDate + "T" + schedule.departureTime
//         );

//         const boardingTime = new Date(departure.getTime() - (30 * 60 * 1000));

//         if (now >= departure) {
//             if (schedule.status !== "Departed") {
//                 loadNotifyMessage("departed", { busNumber: schedule.busNumber });
//             }
//             schedule.status = "Departed";
//         }
//         else if (now >= boardingTime) {
//             if (schedule.status !== "Boarding") {
//                 loadNotifyMessage("boarding", { busNumber: schedule.busNumber });
//             }
//             schedule.status = "Boarding";
//         }
//         else {
//             schedule.status = "Scheduled";
//         }
//     });
//     localStorage.setItem("schedules", JSON.stringify(schedules));
// }


// function editSchedules(index) {
//     let schedules = JSON.parse(localStorage.getItem("schedules")) || [];

//     const schedule = schedules[index];

//     document.getElementById("busNumber").value = schedule.busNumber;
//     document.getElementById("routeName").value = schedule.routeName;
//     document.getElementById("departureDate").value = schedule.departureDate;
//     document.getElementById("departureTime").value = schedule.departureTime;
//     document.getElementById("expectedArrivalDate").value = schedule.expectedArrivalDate || "";
//     document.getElementById("expectedArrivalTime").value = schedule.expectedArrivalTime || "";

//     scheduleEditIndex = index;

//     document.querySelector("#scheduleForm button").textContent = "Update Schedule";
// }

// function cancelSchedules(index) {
//     if (!confirm("Cancel this schedule?")) {
//         return;
//     }

//     let schedules = JSON.parse(localStorage.getItem("schedules")) || [];

//     schedules[index].status = "Cancelled";
//     schedules[index].manualStatus = true;

//     localStorage.setItem("schedules", JSON.stringify(schedules));

//     refreshDashboard();

//     refreshDashboard();

//     if (typeof loadDashboardStats === "function") {
//         loadDashboardStats();
//     }

//     if (typeof loadReports === "function") {
//         loadReports();
//     }
//     updateSchedulingStatus();
//     loadSchedules();
// }

// function changeScheduleStatus(index) {
//     let schedules = JSON.parse(localStorage.getItem("schedules")) || [];

//     const newStatus = prompt("Enter status: \nScheduled\nBoarding\nDelayed\nDeparted\nCancelled");

//     if (!newStatus) return;

//     const allowedStatuses = [
//         "Scheduled",
//         "Boarding",
//         "Delayed",
//         "Departed",
//         "Cancelled"
//     ];

//     if (!allowedStatuses.includes(newStatus)) {
//         alert("Invalid status.");
//         return;
//     }

//     schedules[index].status = newStatus;
//     switch (newStatus) {

//         case "Delayed":
//             loadNotifyMessage("delayed", {
//                 busNumber: schedules[index].busNumber
//             });
//             break;

//         case "Cancelled":
//             loadNotifyMessage("cancel", {
//                 busNumber: schedules[index].busNumber
//             });
//             break;
//     }

//     if (newStatus === "Delayed" || newStatus === "Cancelled") {
//         schedules[index].manualStatus = true;
//     } else {
//         schedules[index].manualStatus = false;
//     }

//     localStorage.setItem(
//         "schedules", JSON.stringify(schedules)
//     );

//     refreshDashboard();

//     refreshDashboard();

//     if (typeof loadDashboardStats === "function") {
//         loadDashboardStats();
//     }

//     if (typeof loadReports === "function") {
//         loadReports();
//     }


//     updateSchedulingStatus();
//     loadSchedules();
// }


//=============================
//Booking Section
//============================

const currentBookingPage =
    window.location.pathname.split("/").pop();

const isPassengerBookingPage =
    currentBookingPage === "bookings.html";

const isManagerBookingPage =
    currentBookingPage === "bookinghistory.html";

let bookingEditIndex = -1;

function loadBookingStates() {
    const stateSelect = document.getElementById("bookingState");

    if (!stateSelect) return;

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    let states = [
        ...new Set(
            buses.map(bus => bus.state)
        )
    ];

    if (
        isManagerBookingPage &&
        currentUser &&
        currentUser.role === "staff"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        states = states.filter(state =>
            String(state || "")
                .trim()
                .toLowerCase() === assignedState
        );
    }

    stateSelect.innerHTML =
        '<option value="">Select state</option>';

    states.forEach(state => {
        stateSelect.innerHTML += `
            <option value="${state}">
                ${state}
            </option>
        `;
    });
}

// function loadBookingStates() {
//     const stateSelect = document.getElementById("bookingState");

//     if (!stateSelect) return;

//     let buses = JSON.parse(localStorage.getItem("buses")) || [];

//     const states = [...new Set(
//         buses.map(bus => bus.state)
//     )];

//     stateSelect.innerHTML = '<option value="">Select state</option>';

//     states.forEach(state => {
//         stateSelect.innerHTML += `
//             <option value="${state}">
//                 ${state}
//             </option>
//         `;
//     });
// }

function loadBookingOptions() {
    const busSelect =
        document.getElementById("bookingBusNumber");

    const routeSelect =
        document.getElementById("bookingRoute");

    if (!busSelect || !routeSelect) {
        return;
    }

    busSelect.innerHTML =
        `<option value="">Select Bus</option>`;

    routeSelect.innerHTML =
        `<option value="">Select Route</option>`;

    const selectedState =
        document.getElementById("bookingState")?.value || "";

    let buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    const selectedSchedule =
        JSON.parse(
            localStorage.getItem("selectedSchedule")
        );

    /*
     * PASSENGER SELECTED A SPECIFIC SCHEDULE
     *
     * Only show the bus belonging to that
     * selected schedule.
     */
    if (
        isPassengerBookingPage &&
        selectedSchedule
    ) {

        const selectedBusNumber =
            String(selectedSchedule.busNumber || "")
                .replace(/\s+/g, "")
                .toLowerCase();

        const selectedBus =
            buses.find(bus =>
                `${bus.busNumber}-${bus.busType}`
                    .replace(/\s+/g, "")
                    .toLowerCase() ===
                selectedBusNumber
            );

        if (selectedBus) {
            busSelect.innerHTML += `
                <option value="${selectedBus.busNumber}-${selectedBus.busType}">
                    ${selectedBus.busNumber} - ${selectedBus.busType} ${selectedBus.capacity} (Seats)
                </option>
            `;

            busSelect.value =
                `${selectedBus.busNumber}-${selectedBus.busType}`;
        }

        busSelect.onchange =
            loadBookingRoutes;

        return;
    }

    /*
     * NORMAL BOOKING PAGE
     *
     * Used when there is no selected schedule.
     */
    buses
        .filter(bus =>
            String(bus.state || "")
                .trim()
                .toLowerCase() ===
            String(selectedState || "")
                .trim()
                .toLowerCase()
        )
        .forEach(bus => {

            busSelect.innerHTML += `
                <option value="${bus.busNumber}-${bus.busType}">
                    ${bus.busNumber} - ${bus.busType} ${bus.capacity} (Seats)
                </option>
            `;
        });

    busSelect.onchange =
        loadBookingRoutes;
}

// function loadBookingOptions() {
//     const busSelect = document.getElementById("bookingBusNumber");

//     const routeSelect = document.getElementById("bookingRoute");

//     if (!busSelect || !routeSelect) {
//         return;
//     }



//     //Reset dropdowns
//     busSelect.innerHTML = `<option value="">Select Bus</option>`;
//     routeSelect.innerHTML = `<option value="">Select Route</option>`;

//     const selectedState = document.getElementById("bookingState").value;

//     let buses = JSON.parse(localStorage.getItem("buses")) || [];

//     console.log("========== BUS STATE CHECK ==========");
//     console.log("Selected State:", selectedState);
//     console.log("All Buses:", buses);
//     console.log(
//         "Buses For Selected State:",
//         buses.filter(bus => bus.state === selectedState)
//     );
//     console.log("=====================================");

//     buses.filter(bus => bus.state === selectedState)
//         .forEach(bus => {
//             busSelect.innerHTML += `
//         <option value="${bus.busNumber}-${bus.busType}">
//             ${bus.busNumber} - ${bus.busType} ${bus.capacity} (Seats)
//         </option>
//         `;
//         });
//     console.log(busSelect.innerHTML);

//     busSelect.onchange = loadBookingRoutes;

// }

function loadBookingRoutes() {
    const busSelect =
        document.getElementById("bookingBusNumber");

    const routeSelect =
        document.getElementById("bookingRoute");

    const bookingState =
        document.getElementById("bookingState");

    if (!busSelect || !routeSelect || !bookingState) {
        return;
    }

    const selectedState =
        bookingState.value;

    routeSelect.innerHTML =
        `<option value="">Select Route</option>`;

    const selectedBus =
        busSelect.value
            .replace(/\s+/g, "")
            .toLowerCase();

    let routes =
        JSON.parse(localStorage.getItem("routes")) || [];

    const schedules =
        JSON.parse(localStorage.getItem("schedules")) || [];

    const selectedSchedule =
        JSON.parse(
            localStorage.getItem("selectedSchedule")
        );

    /*
     * PASSENGER SELECTED A SPECIFIC SCHEDULE
     *
     * Match the route to that exact schedule.
     */
    if (
        isPassengerBookingPage &&
        selectedSchedule
    ) {

        const exactSchedule =
            schedules.find(schedule =>
                schedule.routeName ===
                selectedSchedule.routeName &&
                schedule.busNumber
                    .replace(/\s+/g, "")
                    .toLowerCase() ===
                selectedBus &&
                schedule.departureDate ===
                selectedSchedule.departureDate &&
                schedule.departureTime ===
                selectedSchedule.departureTime &&
                schedule.state ===
                selectedSchedule.state &&
                !["Cancelled", "Departed"]
                    .includes(schedule.status)
            );

        if (exactSchedule) {

            const matchingRoute =
                routes.find(route =>
                    route.routeName ===
                    exactSchedule.routeName &&
                    route.state ===
                    selectedState &&
                    route.busType
                        .replace(/\s+/g, "")
                        .toLowerCase() ===
                    selectedBus
                );

            if (matchingRoute) {

                routeSelect.innerHTML += `
                    <option
                        value="${matchingRoute.routeName}"
                        data-fare="${matchingRoute.fare}">
                        ${matchingRoute.routeName}
                    </option>
                `;

                routeSelect.value =
                    matchingRoute.routeName;

                updateTicketPrice();
                loadScheduleInfo();
            }

        }

        return;
    }

    /*
     * NORMAL BOOKING PAGE
     *
     * Used when there is no selected schedule.
     */
    routes
        .filter(route => {

            const activeSchedule =
                schedules.find(schedule =>
                    schedule.routeName ===
                    route.routeName &&
                    schedule.busNumber
                        .replace(/\s+/g, "")
                        .toLowerCase() ===
                    route.busType
                        .replace(/\s+/g, "")
                        .toLowerCase() &&
                    schedule.state ===
                    selectedState &&
                    !["Cancelled", "Departed"]
                        .includes(schedule.status)
                );

            return (
                route.state === selectedState &&
                route.busType
                    .replace(/\s+/g, "")
                    .toLowerCase() === selectedBus &&
                activeSchedule
            );
        })
        .forEach(route => {

            routeSelect.innerHTML += `
                <option
                    value="${route.routeName}"
                    data-fare="${route.fare}">
                    ${route.routeName}
                </option>
            `;
        });

    if (routeSelect.options.length > 1) {

        routeSelect.selectedIndex = 1;

        updateTicketPrice();
        loadScheduleInfo();
    }
}

// function loadBookingRoutes() {
//     const busSelect = document.getElementById("bookingBusNumber");
//     const routeSelect = document.getElementById("bookingRoute");
//     const selectedState = document.getElementById("bookingState").value;

//     routeSelect.innerHTML = `<option value="">Select Route</option>`;

//     const selectedBus = busSelect.value.replace("-", " - ");

//     let routes = JSON.parse(localStorage.getItem("routes")) || [];

//     const schedules = JSON.parse(localStorage.getItem("schedules")) || [];

//     routes
//         .filter(route => {

//             const activeSchedule = schedules.find(schedule =>
//                 schedule.routeName === route.routeName &&
//                 schedule.busNumber.replace(/\s+/g, "") === route.busType.replace(/\s+/g, "") &&
//                 !["Cancelled", "Departed"].includes(schedule.status)
//             );

//             return route.state === selectedState &&
//                 route.busType === selectedBus &&
//                 activeSchedule;
//         })
//         .forEach(route => {
//             routeSelect.innerHTML += `
//         <option value="${route.routeName}" data-fare="${route.fare}">
//             ${route.routeName}
//         </option>
//     `;
//         });

//     if (routeSelect.options.length > 1) {
//         routeSelect.selectedIndex = 1;   // Select the first matching route
//         updateTicketPrice();             // Update the fare
//         loadScheduleInfo();              // Update departure date and time
//     }
// }


function updateRemainingSeats() {

    const busSelect = document.getElementById("bookingBusNumber");
    const seatInfo = document.getElementById("remainingSeats");
    if (!busSelect || !seatInfo) return;

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const selectedBus = busSelect.value;

    const selectedRoute = document.getElementById("bookingRoute").value;

    const schedules = JSON.parse(localStorage.getItem("schedules")) || [];


    const currentSchedule = schedules.find(schedule =>
        schedule.routeName.trim() === selectedRoute.trim() &&
        schedule.busNumber.replace(/\s+/g, "") ===
        selectedBus.replace(/\s+/g, "") &&
        !["Departed", "Cancelled"].includes(schedule.status)
    );

    console.log("Current Schedule:", currentSchedule);
    console.log("Selected Bus:", selectedBus);
    console.log("Selected Route:", selectedRoute);

    const busBookings = bookings.filter(booking =>
        booking.selectedBus === selectedBus &&
        booking.bookingStatus === "Active" &&
        booking.departureDate === currentSchedule?.departureDate &&
        booking.departureTime === currentSchedule?.departureTime
    );
    console.log("Bus Booking:", busBookings);

    if (!selectedBus) {
        seatInfo.textContent = "";
        return;
    }

    const buses = JSON.parse(localStorage.getItem("buses")) || [];

    const bus = buses.find(bus => `${bus.busNumber}-${bus.busType}` === selectedBus);
    if (!bus) {
        seatInfo.textContent = "Bus not found";
        return;
    }
    const remaining = Number(bus.capacity) - busBookings.length;

    // Notify only once when the bus becomes full
    if (remaining === 0 && !bus.fullNotified) {
        loadNotifyMessage("full", {
            busNumber: bus.busNumber
        });

        bus.fullNotified = true;
        localStorage.setItem("buses", JSON.stringify(buses));
    }

    // Reset notification when seats become available again
    if (remaining > 0) {
        bus.fullNotified = false;
        localStorage.setItem("buses", JSON.stringify(buses));
    }


    seatInfo.textContent = `Seats Left:${remaining}`;


}

function loadBookings() {
    const tableBody = document.getElementById("bookingTableBody");

    if (!tableBody) {
        return;
    }

    calculateBookingHistoryRevenue();

    tableBody.innerHTML = "";

    const searchValue =
        document.getElementById("searchBooking")?.value.toLowerCase() || "";

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let visibleBookings = bookings;

    /* STATE RESTRICTION FOR MANAGER BOOKING HISTORY ONLY */
    if (
        isManagerBookingPage &&
        currentUser &&
        currentUser.role === "staff"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        visibleBookings =
            bookings.filter(booking =>
                String(booking.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );
    }

    /* Hide expired and cancelled bookings from the booking table */
    const activeBookings = visibleBookings.filter(
        booking =>
            booking.bookingStatus !== "Expired" &&
            booking.bookingStatus !== "Cancelled"
    );

    const totalBookings =
        document.getElementById("totalBookings");

    if (totalBookings) {
        totalBookings.textContent =
            activeBookings.length;
    }

    if (activeBookings.length === 0) {

        tableBody.innerHTML = `
        <tr>
            <td colspan="26" style="text-align:center;">
                No bookings available
            </td>
        </tr>
        `;

        return;
    }

    const filteredBookings =
        activeBookings.filter(booking =>
            booking.bookingStatus !== "Cancelled" && (
                (booking.receiptNumber || "")
                    .toLowerCase()
                    .includes(searchValue)
                ||
                (booking.bookingId || "")
                    .toLowerCase()
                    .includes(searchValue)
                ||
                (booking.passengerName || "")
                    .toLowerCase()
                    .includes(searchValue)
            )
        );

    if (filteredBookings.length === 0) {

        tableBody.innerHTML = `
        <tr>
            <td colspan="26" style="text-align:center;">
                No matching booking found
            </td>
        </tr>
        `;

        return;
    }

    filteredBookings.forEach((booking) => {

        const originalIndex =
            bookings.findIndex(
                b => b.bookingId === booking.bookingId
            );

        tableBody.innerHTML += `
        <tr id="booking-${originalIndex}">
            <td data-label="Booking ID">${booking.bookingId}</td> 
            <td data-label="Receipt Number">${booking.receiptNumber}</td>
            <td data-label="State">${booking.state}</td>   
            <td data-label="Passenger Name">${booking.passengerName}</td>
            <td data-label="Passenger Phone">${booking.passengerPhone}</td>
            <td data-label="Passenger Email">${booking.passengerEmail}</td>
            <td data-label="How many kids">${booking.kidCount || 0}</td>
            <td data-label="Sponsor Name">${booking.sponsorName}</td>
            <td data-label="Sponsor Phone">${booking.sponsorPhone}</td>
            <td data-label="Sponsor Email">${booking.sponsorEmail}</td>
            <td data-label="Gender">${booking.gender}</td>
            <td data-label="Bus">${booking.busNumber}</td>
            <td data-label="Route">${booking.route}</td>
            <td data-label="Bus Status">${getStatusWithEmoji(booking.busStatus)}</td>
            <td data-label="Payment Method">${booking.paymentMethod || "-"}</td>
            <td data-label="Payment Status">${booking.paymentStatus || "Pending"}</td>
            <td data-label="Transaction Reference">${booking.transactionReference || "-"}</td>
            <td data-label="Booking Status">${booking.bookingStatus || "-"}</td>
            <td data-label="Ticket Type">${booking.ticketType}</td>
            <td data-label="Seat">${booking.seatNumber}</td>
            <td data-label="Departure Date">${booking.departureDate}</td>
            <td data-label="Departure Time">${to12Hour(booking.departureTime)}</td>
            <td data-label="Driver Name">${booking.driverName}</td>  
            <td data-label="Ticket Price">₦${Number(booking.ticketPrice).toLocaleString()}</td>
            <td data-label="Booking Date">${booking.bookingDate}</td>
            <td>

            <button
                onclick="openTicketById('${String(booking.bookingId).replace(/'/g, "\\'")}')"
                class="arrow"
                title="Print Ticket">
                <i class="fa-solid fa-arrow-right"></i>
            </button>

            <button
                onclick="emailBookingById('${String(booking.bookingId).replace(/'/g, "\\'")}')"
                class="email-btn"
                title="Email Ticket">
                <i class="fa-solid fa-envelope"></i>
            </button>

            <button
                onclick="editBookingById(this.dataset.bookingId)"
                data-booking-id="${booking.bookingId}"
                class="edit-btn">
                Edit
            </button>

            <button
                onclick="cancelBooking(${originalIndex})"
                class="delete-btn">
                Cancel
            </button>

            ${booking.paymentMethod === "Transfer" &&
                booking.paymentStatus === "Pending Verification" &&
                booking.bookingStatus !== "Cancelled"
                ? `
                <button type="button"
                    class="verify-payment-btn"
                    onclick="verifyTransferPayment('${String(booking.bookingId).replace(/'/g, "\\'")}')">
                    <i class="fa-solid fa-check"></i>
                    Verify Payment
                </button>
                `
                : ""
            }

            ${booking.paymentMethod === "Cash" &&
                booking.paymentStatus === "Pending" &&
                booking.bookingStatus !== "Cancelled"
                ? `
                <button type="button"
                    class="verify-payment-btn cash-verify-btn"
                    onclick="verifyCashPayment('${String(booking.bookingId).replace(/'/g, "\\'")}')">
                    <i class="fa-solid fa-money-bill-wave"></i>
                    Confirm Cash Payment
                </button>
                `
                : ""}

            </td>
        </tr>
        `;
    });
}

// function loadBookings() {
//     const tableBody = document.getElementById("bookingTableBody");

//     if (!tableBody) {
//         return;
//     }

//     tableBody.innerHTML = "";

//     const searchValue = document.getElementById("searchBooking")?.value.toLowerCase() || "";

//     const bookings = JSON.parse(localStorage.getItem("bookings")) || [];

//     //Hide expired bookings from the booking table
//     const activeBookings = bookings.filter(
//         booking =>
//             booking.bookingStatus !== "Expired" &&
//             booking.bookingStatus !== "Cancelled"
//     );


//     const totalBookings = document.getElementById("totalBookings");
//     if (totalBookings) {
//         totalBookings.textContent = activeBookings.length;
//     }

//     if (activeBookings.length === 0) {

//         tableBody.innerHTML = `
//         <tr>
//             <td colspan="26" style="text-align:center;">
//                 No bookings available
//             </td>
//         </tr>
//         `;

//         return;
//     }

//     const filteredBookings = activeBookings.filter(booking =>
//         booking.bookingStatus !== "Cancelled" && (
//             (booking.receiptNumber || "").toLowerCase().includes(searchValue)
//             ||
//             (booking.bookingId || "").toLowerCase().includes(searchValue)
//             ||
//             (booking.passengerName || "").toLowerCase().includes(searchValue)
//         )

//     );
//     if (filteredBookings.length === 0) {
//         tableBody.innerHTML = `
//         <tr>
//             <td colspan="26" style="text-align:center;">
//                 No matching booking found
//             </td>
//         </tr>
//         `;

//         return;
//     }
//     filteredBookings.forEach((booking) => {
//         const originalIndex = bookings.findIndex(
//             b => b.bookingId === booking.bookingId
//         );
//         tableBody.innerHTML += `
//         <tr id="booking-${originalIndex}">
//             <td data-label="Booking ID">${booking.bookingId}</td> 
//             <td data-label="Receipt Number">${booking.receiptNumber}</td>
//             <td data-label="State">${booking.state}</td>   
//             <td data-label="Passenger Name">${booking.passengerName}</td>
//             <td data-label="Passenger Phone">${booking.passengerPhone}</td>
//              <td data-label="Passenger Email">${booking.passengerEmail}</td>
//              <td data-label="How many kids">${booking.kidCount || 0}</td>
//             <td data-label="Sponsor Name">${booking.sponsorName}</td>
//             <td data-label="Sponsor Phone">${booking.sponsorPhone}</td>
//              <td data-label="Sponsor Email">${booking.sponsorEmail}</td>
//               <td data-label="Gender">${booking.gender}</td>
//             <td data-label="Bus">${booking.busNumber}</td>
//             <td data-label="Route">${booking.route}</td>
//              <td data-label="Bus Status">${getStatusWithEmoji(booking.busStatus)}</td>
//             <td data-label="Payment Method">${booking.paymentMethod || "-"}</td>
//             <td data-label="Payment Status">${booking.paymentStatus || "Pending"}</td>
//             <td data-label="Transaction Reference">${booking.transactionReference || "-"}</td>
//             <td data-label="Booking Status">${booking.bookingStatus || "-"}</td>
//             <td data-label="Ticket Type">${booking.ticketType}</td>
//             <td data-label="Seat">${booking.seatNumber}</td>
//             <td data-label="Departure Date">${booking.departureDate}</td>
//              <td data-label="Departure Time">${to12Hour(booking.departureTime)}</td>
//               <td data-label="Driver Name">${booking.driverName}</td>  
//             <td data-label="Ticket Price">\u20A6${Number(booking.ticketPrice).toLocaleString()}</td>
//             <td data-label="Booking Date">${booking.bookingDate}</td>
//             <td>
//             <button
//                 onclick="openTicketById('${String(booking.bookingId).replace(/'/g, "\\'")}')"
//                 class="arrow"
//                 title="Print Ticket">
//                 <i class="fa-solid fa-arrow-right"></i>
//             </button>

//             <button
//                 onclick="emailBookingById('${String(booking.bookingId).replace(/'/g, "\\'")}')"
//                 class="email-btn"
//                 title="Email Ticket">
//                 <i class="fa-solid fa-envelope"></i>
//             </button>

//             <button
//                 onclick="editBookingById(this.dataset.bookingId)"
//                 data-booking-id="${booking.bookingId}"
//                 class="edit-btn">
//                 Edit
//             </button>

//             <button
//                 onclick="cancelBooking(${originalIndex})"
//                 class="delete-btn">
//                 Cancel
//             </button>

//                 ${booking.paymentMethod === "Transfer" &&
//                 booking.paymentStatus === "Pending Verification" &&
//                 booking.bookingStatus !== "Cancelled"
//                 ? `
//                 <button type="button" class="verify-payment-btn" onclick="verifyTransferPayment('${String(booking.bookingId).replace(/'/g, "\\'")}')">
//                     <i class="fa-solid fa-check"></i>
//                     Verify Payment
//                 </button>
//                 `
//                 : ""
//             }

//             ${booking.paymentMethod === "Cash" &&
//                 booking.paymentStatus === "Pending" &&
//                 booking.bookingStatus !== "Cancelled"
//                 ? `
//                 <button type="button"
//                     class="verify-payment-btn cash-verify-btn"
//                     onclick="verifyCashPayment('${String(booking.bookingId).replace(/'/g, "\\'")}')">
//                     <i class="fa-solid fa-money-bill-wave"></i>
//                     Confirm Cash Payment
//                 </button>
//                 `
//                 : ""}

//             </td>
//         </tr>
//         `;
//     });
// }

/* =========================================================
   VERIFY TRANSFER PAYMENT
   ========================================================= */

function verifyTransferPayment(bookingId) {

    let bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const bookingIndex = bookings.findIndex(
        booking => booking.bookingId === bookingId
    );

    if (bookingIndex === -1) {
        console.error("Booking not found.");
        return;
    }

    const booking = bookings[bookingIndex];

    /* -----------------------------------------
       CHECK PAYMENT METHOD
       ----------------------------------------- */

    if (booking.paymentMethod !== "Transfer") {
        console.error(
            "This booking was not made by bank transfer."
        );
        return;
    }

    /* -----------------------------------------
       CHECK PAYMENT STATUS
       ----------------------------------------- */

    if (booking.paymentStatus !== "Pending Verification") {
        console.error(
            "This transfer payment has already been processed."
        );
        return;
    }

    /* -----------------------------------------
       GET PAYMENT AMOUNT
       ----------------------------------------- */

    const amount =
        Number(booking.ticketPrice) || 0;

    /* -----------------------------------------
       GET TRANSFER REFERENCE
       ----------------------------------------- */

    const transferReference =
        booking.transactionReference ||
        "";

    /* -----------------------------------------
       GET CONFIRMATION POPUP
       ----------------------------------------- */

    const popup =
        document.getElementById("transferConfirmPopup");

    const message =
        document.getElementById("transferConfirmMessage");

    const yesButton =
        document.getElementById("confirmTransferYes");

    const noButton =
        document.getElementById("confirmTransferNo");

    if (!popup || !message || !yesButton || !noButton) {
        console.error(
            "Transfer confirmation popup not found."
        );
        return;
    }

    /* -----------------------------------------
       DISPLAY CONFIRMATION MESSAGE
       ----------------------------------------- */

    message.innerHTML =
        "Have you confirmed that the bank transfer of " +
        "<strong>₦" +
        amount.toLocaleString() +
        "</strong> has been received from " +
        "<strong>" +
        booking.passengerName +
        "</strong>?";

    /* -----------------------------------------
       SHOW POPUP
       ----------------------------------------- */

    popup.style.display = "flex";

    /* -----------------------------------------
       YES, VERIFY
       ----------------------------------------- */

    yesButton.onclick = function () {

        popup.style.display = "none";

        /* Mark payment as paid */

        booking.paymentStatus = "Paid";

        /* Keep transfer method */

        booking.paymentMethod = "Transfer";

        /* -------------------------------------
           GENERATE RECEIPT
           ------------------------------------- */

        if (
            !booking.receiptNumber ||
            booking.receiptNumber === "null"
        ) {
            booking.receiptNumber =
                generateReceiptNumber();
        }

        /* -------------------------------------
           UPDATE REVENUE
           ------------------------------------- */

        let totalRevenue =
            Number(
                localStorage.getItem("totalRevenue")
            ) || 0;

        totalRevenue += amount;

        localStorage.setItem(
            "totalRevenue",
            totalRevenue
        );

        /* -------------------------------------
           SAVE UPDATED BOOKING
           ------------------------------------- */

        bookings[bookingIndex] = booking;

        localStorage.setItem(
            "bookings",
            JSON.stringify(bookings)
        );

        /* -------------------------------------
           REFRESH MANAGER TABLE
           ------------------------------------- */

        if (typeof loadBookings === "function") {
            loadBookings();
        }

        /* -------------------------------------
           REFRESH DASHBOARD
           ------------------------------------- */

        if (typeof refreshDashboard === "function") {
            refreshDashboard();
        }

        if (typeof loadDashboardStats === "function") {
            loadDashboardStats();
        }

        /* -------------------------------------
           SHOW PAYMENT SUCCESS POPUP
           ------------------------------------- */

        const successPopup =
            document.getElementById(
                "paymentSuccessPopup"
            );

        const successMessage =
            document.getElementById(
                "paymentSuccessMessage"
            );

        if (successPopup && successMessage) {

            successMessage.innerHTML =
                "Bank transfer verified successfully.<br><br>" +

                "<strong>Passenger:</strong> " +
                booking.passengerName +
                "<br>" +

                "<strong>Amount Paid:</strong> ₦" +
                amount.toLocaleString() +
                "<br>" +

                "<strong>Transfer Reference:</strong> " +
                (
                    transferReference || "-"
                ) +
                "<br>" +

                "<strong>Receipt No:</strong> " +
                booking.receiptNumber;

            successPopup.style.display = "flex";
        }

    };

    /* -----------------------------------------
       NO, CANCEL
       ----------------------------------------- */

    noButton.onclick = function () {

        popup.style.display = "none";

    };

}

/* =========================================================
   VERIFY CASH PAYMENT
   Manager confirms cash received at the terminal
   ========================================================= */

function verifyCashPayment(bookingId) {

    let bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const bookingIndex = bookings.findIndex(
        booking => booking.bookingId === bookingId
    );

    if (bookingIndex === -1) {
        alert("Booking not found.");
        return;
    }

    const booking = bookings[bookingIndex];

    // Make sure this is a cash booking
    if (
        booking.paymentMethod !== "Cash" &&
        booking.paymentMethod !== "Cash-Paid"
    ) {
        alert("This booking was not made with cash.");
        return;
    }

    // Make sure payment is still pending
    if (booking.paymentStatus !== "Pending") {
        alert("This cash payment has already been processed.");
        return;
    }

    const amount =
        Number(booking.ticketPrice) || 0;

    const popup = document.getElementById("cashConfirmPopup");
    const message = document.getElementById("cashConfirmMessage");
    const yesButton = document.getElementById("confirmCashYes");
    const noButton = document.getElementById("confirmCashNo");

    if (!popup || !message || !yesButton || !noButton) {
        alert("Confirmation popup not found.");
        return;
    }

    message.innerHTML =
        "Have you received <strong>₦" +
        amount.toLocaleString() +
        "</strong> from <strong>" +
        booking.passengerName +
        "</strong>?";

    popup.style.display = "flex";

    yesButton.onclick = function () {
        popup.style.display = "none";


        booking.paymentMethod = "Cash-Paid";
        booking.paymentStatus = "Paid";

        /* Generate internal cash transaction reference */
        if (
            !booking.transactionReference ||
            booking.transactionReference === "null"
        ) {
            booking.transactionReference =
                "CASH-" + Date.now();
        }

        /* Generate receipt number */
        if (
            !booking.receiptNumber ||
            booking.receiptNumber === "null"
        ) {
            booking.receiptNumber = generateReceiptNumber();
        }

        let totalRevenue =
            Number(localStorage.getItem("totalRevenue")) || 0;

        totalRevenue += amount;

        localStorage.setItem(
            "totalRevenue",
            totalRevenue
        );

        bookings[bookingIndex] = booking;

        localStorage.setItem(
            "bookings",
            JSON.stringify(bookings)
        );

        loadBookings();

        if (typeof refreshDashboard === "function") {
            refreshDashboard();
        }

        if (typeof loadDashboardStats === "function") {
            loadDashboardStats();
        }

        const successPopup = document.getElementById("paymentSuccessPopup");

        if (successPopup) {
            document.getElementById("paymentSuccessMessage").innerHTML =
                "Cash payment confirmed successfully.<br><br>" +
                "<strong>Passenger:</strong> " +
                booking.passengerName +
                "<br>" +
                "<strong>Amount Paid:</strong> ₦" +
                amount.toLocaleString() +
                "<br>" +
                "<strong>Receipt No:</strong> " +
                booking.receiptNumber;

            successPopup.style.display = "flex";
        }
    };

    noButton.onclick = function () {
        popup.style.display = "none";
    };
}

document.addEventListener("DOMContentLoaded", function () {

    const successPopup = document.getElementById("paymentSuccessPopup");
    const successOk = document.getElementById("paymentSuccessOk");

    if (successOk && successPopup) {
        successOk.addEventListener("click", function () {
            successPopup.style.display = "none";
        });
    }

});


// function openTicketById(bookingId) {

//     const bookings =
//         JSON.parse(localStorage.getItem("bookings")) || [];

//     const booking = bookings.find(
//         b => String(b.bookingId) === String(bookingId)
//     );

//     if (!booking) {
//         alert("Booking not found.");
//         return;
//     }

//     const paymentStatus =
//         String(booking.paymentStatus || "")
//             .trim()
//             .toLowerCase();

//     if (paymentStatus !== "paid") {
//         alert(
//             "This booking cannot be printed because payment is still pending."
//         );
//         return;
//     }

//     localStorage.setItem(
//         "selectedPassenger",
//         booking.passengerName + "-" + booking.route
//     );

//     localStorage.setItem(
//         "selectedPassengerName",
//         booking.passengerName
//     );

//     localStorage.setItem(
//         "selectedBookingId",
//         booking.bookingId
//     );

//     window.location.href = "ticket.html";
// }

function openTicketById(bookingId) {

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const booking = bookings.find(
        b => String(b.bookingId) === String(bookingId)
    );

    if (!booking) {
        alert("Booking not found.");
        return;
    }

    // Prevent cancelled and expired bookings
    const bookingStatus =
        String(booking.bookingStatus || "")
            .trim()
            .toLowerCase();

    if (
        bookingStatus === "cancelled" ||
        bookingStatus === "expired"
    ) {
        alert(
            "This booking cannot be printed because it is " +
            booking.bookingStatus.toLowerCase() + "."
        );
        return;
    }

    const paymentStatus =
        String(booking.paymentStatus || "")
            .trim()
            .toLowerCase();

    if (paymentStatus !== "paid") {
        alert(
            "This booking cannot be printed because payment is still pending."
        );
        return;
    }

    // Save the passenger name for the ticket page
    localStorage.setItem(
        "selectedPassenger",
        booking.passengerName
    );

    localStorage.setItem(
        "selectedPassengerName",
        booking.passengerName
    );

    localStorage.setItem(
        "selectedBookingId",
        booking.bookingId
    );

    window.location.href = "ticket.html";
}

function emailBookingById(bookingId) {

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const booking = bookings.find(
        b => String(b.bookingId) === String(bookingId)
    );

    if (!booking) {
        alert("Booking not found.");
        return;
    }

    // Prevent cancelled and expired bookings
    const bookingStatus =
        String(booking.bookingStatus || "")
            .trim()
            .toLowerCase();

    if (
        bookingStatus === "cancelled" ||
        bookingStatus === "expired"
    ) {
        alert(
            "This booking cannot be emailed because it is " +
            booking.bookingStatus.toLowerCase() + "."
        );
        return;
    }

    // Check passenger email
    const passengerEmail =
        String(booking.passengerEmail || "").trim();

    if (!passengerEmail) {
        alert(
            "No passenger email is available for this booking."
        );
        return;
    }

    // Same information used in the printed passenger slip
    const emailBody = `
TRANSNOVA EXPRESS PASSENGER SLIP

----------------------------------------

Booking ID: ${booking.bookingId}
State: ${booking.state}
Passenger Name: ${booking.passengerName}
Passenger Phone: ${booking.passengerPhone}
Number of Kids: ${booking.kidCount || 0}
Sponsor Name: ${booking.sponsorName}
Sponsor Phone: ${booking.sponsorPhone}
Bus: ${booking.busNumber}
Route: ${booking.route}
Payment Method: ${booking.paymentMethod}
Payment Status: ${booking.paymentStatus}
Booking Date: ${booking.bookingDate}
Departure Date: ${booking.departureDate}
Departure Time: ${to12Hour(booking.departureTime)}
Driver Name: ${booking.driverName}
Ticket Price: ₦${Number(booking.ticketPrice).toLocaleString()}

----------------------------------------

Please arrive at the terminal at least 30 minutes before the scheduled departure time to collect your complete receipt and finalize boarding procedures.

----------------------------------------

TRANSNOVA EXPRESS
Passenger Booking Slip
`;

    const subject =
        `AGE TRANSIT COMPANY Passenger Slip - ${booking.bookingId}`;

    const mailtoLink =
        `mailto:${encodeURIComponent(passengerEmail)}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoLink;
}


function calculateRevenue() {
    const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const totalRevenue = bookings.filter(b => b.paymentStatus ===
        "Paid" && b.bookingStatus !== "Cancelled").reduce((sum, b) => sum +
            Number(b.ticketPrice || 0), 0);

    localStorage.setItem("totalRevenue", totalRevenue);


    const revenueElement = document.getElementById("totalRevenue");

    if (revenueElement) {
        revenueElement.textContent = "\u20A6" + totalRevenue.toLocaleString();
    }

    if (typeof loadReports === "function") {
        loadReports();
    }

}

function calculateBookingHistoryRevenue() {

    const revenueElement =
        document.getElementById("bookingHistoryRevenue");

    if (!revenueElement) return;

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let visibleBookings = bookings;

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        visibleBookings =
            bookings.filter(booking =>
                String(booking.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );
    }

    const totalRevenue =
        visibleBookings
            .filter(booking =>
                booking.paymentStatus === "Paid" &&
                booking.bookingStatus !== "Cancelled"
            )
            .reduce(
                (sum, booking) =>
                    sum +
                    (
                        Number(
                            String(
                                booking.ticketPrice ||
                                booking.fare ||
                                booking.amount ||
                                0
                            ).replace(/[₦,]/g, "")
                        ) || 0
                    ),
                0
            );

    revenueElement.textContent =
        "₦" + totalRevenue.toLocaleString();
}


function updateTicketPrice() {
    const routeName = document.getElementById("bookingRoute").value;
    const busNumber = document.getElementById("bookingBusNumber").value.replace("-", " - ");

    const routes = JSON.parse(localStorage.getItem("routes")) || [];

    const route = routes.find(r =>
        r.routeName.trim() === routeName.trim() &&
        r.busType.trim() === busNumber.trim()
    );

    if (route) {
        document.getElementById("ticketPrice").value =
            "\u20A6" + Number(route.fare).toLocaleString();
    } else {
        document.getElementById("ticketPrice").value = "";
    }

}

function loadScheduleInfo() {
    const routeName = document.getElementById("bookingRoute").value;
    const busNumber = document.getElementById("bookingBusNumber").value.replace("-", " - ")
    const schedules = JSON.parse(localStorage.getItem("schedules")) || [];

    const schedule = schedules.find(schedule =>
        schedule.routeName.trim() === routeName.trim() &&
        schedule.busNumber.replace(/\s+/g, "") === busNumber.replace(/\s+/g, "") &&
        schedule.status !== "Departed" &&
        schedule.status !== "Cancelled"
    );

    if (schedule) {
        document.getElementById("departureDate").value = schedule.departureDate;
        document.getElementById("departureTime").value = schedule.departureTime;
    } else {
        document.getElementById("departureDate").value = "";
        document.getElementById("departureTime").value = "";
    }
}
function loadDriverName() {

    const selectedBus =
        document.getElementById("bookingBusNumber")?.value || "";

    const drivers =
        JSON.parse(localStorage.getItem("drivers")) || [];

    const selectedBusKey =
        selectedBus
            .replace(/\s+/g, "")
            .toLowerCase();

    const driver =
        drivers.find(driver => {

            const driverBus =
                String(driver.busNumber || "")
                    .replace(/\s+/g, "")
                    .toLowerCase();

            return driverBus === selectedBusKey;
        });

    if (driver) {

        document.getElementById("driverName").value =
            driver.driverName;

    } else {

        document.getElementById("driverName").value = "";

    }
}

// function loadDriverName() {
//     const selectedBus = document.getElementById("bookingBusNumber").value;
//     const staffs = JSON.parse(localStorage.getItem("staffs")) || [];
//     const driver = staffs.find(staff => staff.busNumber.replace(/\s+/g, "") === selectedBus.replace(/\s+/g, "")
//     );

//     if (driver) {
//         document.getElementById("driverName").value = driver.staffName;
//     } else {
//         document.getElementById("driverName").value = "";
//     }
// }

function loadBusStatus() {
    const routeName = document.getElementById("bookingRoute").value;
    const busNumber = document.getElementById("bookingBusNumber").value;
    const schedules = JSON.parse(localStorage.getItem("schedules")) || [];
    const schedule = schedules.find(schedule =>
        schedule.routeName.trim() === routeName.trim() &&
        schedule.busNumber.replace(/\s+/g, "") === busNumber.replace(/\s+/g, "") &&
        !["Departed", "Cancelled"].includes(schedule.status)
    );

    if (!schedule) {
        document.getElementById("busStatus").value = "";
        return;
    }

    let status = schedule.status;

    switch (status) {
        case "Scheduled":
            status = "🟢 Scheduled";
            break;
        case "Boarding":
            status = "🔵 Boarding";
            break;
        case "Delayed":
            status = "🟡 Delayed";
            break;
        case "Departed":
            status = "🔴 Departed";
            break;
        case "Cancelled":
            status = "❌ Cancelled";
            break;
    }

    document.getElementById("busStatus").value = status;
}

function getPaymentStatus() {
    const paymentMethod = document.getElementById("paymentMethod").value;

    if (paymentMethod === "Cash") {
        return "Pending";
    }
    return "Paid";
}

function generateReceiptNumber() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `REC-${timestamp}-${random}`;
}



/* =========================================================
   BUS INTERIOR SEAT MAP
   ========================================================= */

function loadSeatMap() {

    const seatMap = document.getElementById("seatMap");

    const selectedSeatDisplay =
        document.getElementById("selectedSeatDisplay");

    const seatNumberInput =
        document.getElementById("seatNumber");

    if (!seatMap) return;

    seatMap.innerHTML = "";


    /* =====================================================
       CHECK BUS SELECTION
       ===================================================== */

    const busNumber =
        document.getElementById("bookingBusNumber")?.value;

    if (!busNumber) {

        if (selectedSeatDisplay) {
            selectedSeatDisplay.innerHTML =
                'Selected Seat: <strong>None</strong>';
        }

        if (seatNumberInput) {
            seatNumberInput.value = "";
        }

        return;
    }


    /* =====================================================
       GET SELECTED BUS
       ===================================================== */

    const buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    const selectedBus =
        buses.find(bus => {

            const busKey =
                `${bus.busNumber}-${bus.busType}`;

            return (
                busKey.replace(/\s+/g, "").toLowerCase() ===
                busNumber.replace(/\s+/g, "").toLowerCase()
            );

        });

    if (!selectedBus) return;


    const capacity =
        Number(selectedBus.capacity) || 0;

    if (capacity <= 0) return;


    /* =====================================================
       EXISTING BOOKINGS
       ===================================================== */

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const route =
        document.getElementById("bookingRoute")?.value || "";

    const departureDate =
        document.getElementById("departureDate")?.value || "";

    const departureTime =
        document.getElementById("departureTime")?.value || "";


    /* =====================================================
       FIND OCCUPIED SEATS
       ===================================================== */

    const occupiedSeats = bookings
        .filter(booking => {

            const sameBus =
                booking.selectedBus === busNumber ||
                booking.busNumber === busNumber;

            const sameRoute =
                !route ||
                booking.route === route;

            const sameDate =
                !departureDate ||
                booking.departureDate === departureDate;

            const sameTime =
                !departureTime ||
                booking.departureTime === departureTime;

            const activeBooking =
                booking.bookingStatus !== "Cancelled" &&
                booking.bookingStatus !== "Expired";

            const isEditingThisBooking =
                bookingEditIndex !== -1 &&
                bookings[bookingEditIndex] === booking;

            return (
                sameBus &&
                sameRoute &&
                sameDate &&
                sameTime &&
                activeBooking &&
                !isEditingThisBooking &&
                booking.seatNumber
            );

        })
        .map(booking => booking.seatNumber);


    /* =====================================================
       CREATE SEAT FUNCTION
       ===================================================== */

    function createSeat(seatNumberValue) {

        const seat =
            document.createElement("button");

        seat.type = "button";

        seat.className = "seat";

        seat.textContent =
            seatNumberValue;

        seat.dataset.seat =
            seatNumberValue;


        /* ---------------------------------------------
           OCCUPIED SEAT
           --------------------------------------------- */

        if (
            occupiedSeats.includes(
                seatNumberValue
            )
        ) {

            seat.classList.add("occupied");

            seat.disabled = true;

        }


        /* ---------------------------------------------
           AVAILABLE SEAT
           --------------------------------------------- */

        else {

            seat.addEventListener(
                "click",
                function () {

                    /*
                       Remove previous selection
                    */

                    document
                        .querySelectorAll(
                            "#seatMap .seat.selected"
                        )
                        .forEach(selected => {

                            selected.classList.remove(
                                "selected"
                            );

                        });


                    /*
                       Select this seat
                    */

                    seat.classList.add(
                        "selected"
                    );


                    /*
                       Store selected seat
                    */

                    if (seatNumberInput) {

                        seatNumberInput.value =
                            seatNumberValue;

                    }


                    /*
                       Display selected seat
                    */

                    if (selectedSeatDisplay) {

                        selectedSeatDisplay.innerHTML =
                            `Selected Seat:
                            <strong>
                                ${seatNumberValue}
                            </strong>`;

                    }

                }
            );

        }

        return seat;
    }


    /* =====================================================
       FRONT AREA
       DRIVER + A01
       ===================================================== */

    const frontRow =
        document.createElement("div");

    frontRow.className =
        "bus-front-row";


    /*
       Driver seat
    */

    const driverSeat =
        document.createElement("div");

    driverSeat.className =
        "driver-seat";

    driverSeat.innerHTML = `
        <i class="fa-solid fa-steering-wheel"></i>
        <span>Driver</span>
    `;


    /*
       A01 beside driver
    */

    let nextSeatNumber = 1;

    if (capacity >= 1) {

        const firstPassengerSeat =
            createSeat("A01");

        frontRow.appendChild(
            driverSeat
        );

        frontRow.appendChild(
            firstPassengerSeat
        );

        nextSeatNumber = 2;

    } else {

        frontRow.appendChild(
            driverSeat
        );

    }

    seatMap.appendChild(
        frontRow
    );


    /* =====================================================
       PASSENGER SEAT ROWS
       2 + 2 SEATING
       ===================================================== */

    while (nextSeatNumber <= capacity) {

        const passengerRow =
            document.createElement("div");

        passengerRow.className =
            "bus-passenger-row";


        /*
           Left pair
        */

        const leftPair =
            document.createElement("div");

        leftPair.className =
            "bus-seat-pair";


        /*
           Right pair
        */

        const rightPair =
            document.createElement("div");

        rightPair.className =
            "bus-seat-pair";


        /*
           Seat 1 of left pair
        */

        if (nextSeatNumber <= capacity) {

            leftPair.appendChild(
                createSeat(
                    "A" +
                    String(nextSeatNumber)
                        .padStart(2, "0")
                )
            );

            nextSeatNumber++;

        }


        /*
           Seat 2 of left pair
        */

        if (nextSeatNumber <= capacity) {

            leftPair.appendChild(
                createSeat(
                    "A" +
                    String(nextSeatNumber)
                        .padStart(2, "0")
                )
            );

            nextSeatNumber++;

        }


        /*
           Seat 1 of right pair
        */

        if (nextSeatNumber <= capacity) {

            rightPair.appendChild(
                createSeat(
                    "A" +
                    String(nextSeatNumber)
                        .padStart(2, "0")
                )
            );

            nextSeatNumber++;

        }


        /*
           Seat 2 of right pair
        */

        if (nextSeatNumber <= capacity) {

            rightPair.appendChild(
                createSeat(
                    "A" +
                    String(nextSeatNumber)
                        .padStart(2, "0")
                )
            );

            nextSeatNumber++;

        }


        passengerRow.appendChild(
            leftPair
        );

        passengerRow.appendChild(
            rightPair
        );

        seatMap.appendChild(
            passengerRow
        );

    }


    /* =====================================================
       BOOT / LUGGAGE AREA
       ===================================================== */

    const boot =
        document.createElement("div");

    boot.className =
        "bus-boot";

    boot.innerHTML = `
        <i class="fa-solid fa-suitcase-rolling"></i>
        <span>BOOT / LUGGAGE</span>
    `;

    seatMap.appendChild(
        boot
    );

}


//scheduleinitialize
//Initialize Page
document.addEventListener("DOMContentLoaded", () => {

    const bookingForm = document.getElementById("bookingForm");

    if (!bookingForm) {
        return;
    }

    loadBookingStates();
    loadBookingOptions();

    const selectedSchedule =
        JSON.parse(localStorage.getItem("selectedSchedule"));

    if (
        selectedSchedule &&
        window.location.pathname.includes("bookings.html")
    ) {

        document.getElementById("bookingState").value =
            selectedSchedule.state;

        loadBookingOptions();

        document.getElementById("bookingBusNumber").value =
            selectedSchedule.busNumber.replace(" - ", "-");

        loadBookingRoutes();

        document.getElementById("bookingRoute").value =
            selectedSchedule.routeName;

        /*
         * Keep the exact schedule selected from
         * Available Schedules.
         */
        document.getElementById("departureDate").value =
            selectedSchedule.departureDate;

        document.getElementById("departureTime").value =
            selectedSchedule.departureTime;

        updateTicketPrice();
        updateRemainingSeats();
        loadDriverName();
        loadBusStatus();
        loadSeatMap();

        localStorage.removeItem("selectedSchedule");
    }

    document.getElementById("bookingState").addEventListener("change", function () {
        loadBookingOptions();

        document.getElementById("departureDate").value = "";
        document.getElementById("departureTime").value = "";
        document.getElementById("ticketPrice").value = "";
        document.getElementById("remainingSeats").textContent = "";

        loadSeatMap();
    });

    removeExpiredBookings();
    loadBookings();
    calculateBookingHistoryRevenue();

    document.getElementById("bookingRoute").addEventListener("change", function () {

        updateTicketPrice();

        loadScheduleInfo();

        loadBusStatus();

        loadSeatMap();

        const busSelect =
            document.getElementById("bookingBusNumber");

        const selectedOption =
            busSelect?.options[busSelect.selectedIndex];

        if (
            selectedOption &&
            selectedOption.hidden
        ) {
            busSelect.value = "";

            document.getElementById("bookingRoute").value = "";

            document.getElementById("departureDate").value = "";

            document.getElementById("departureTime").value = "";

            document.getElementById("ticketPrice").value = "";

            document.getElementById("remainingSeats").textContent =
                "";

            document.getElementById("selectedSeatDisplay").innerHTML =
                'Selected Seat: <strong>None</strong>';

            document.getElementById("seatNumber").value = "";

            loadSeatMap();
        }

    });

    document.getElementById("bookingBusNumber").addEventListener("change", updateRemainingSeats);
    document.getElementById("bookingBusNumber").addEventListener("change", loadDriverName);
    document.getElementById("bookingBusNumber").addEventListener("change", loadBusStatus);
    document.getElementById("bookingBusNumber").addEventListener("change", loadSeatMap);

    const searchBooking = document.getElementById("searchBooking");

    if (searchBooking) {
        searchBooking.addEventListener("input", loadBookings);
    }

    //Submit handler
    bookingForm.addEventListener("submit", function (event) {
        event.preventDefault();

        /* =========================================================
             SEAT VALIDATION
        ========================================================= */

        let selectedSeat =
            document.getElementById("seatNumber")?.value.trim();

        if (!selectedSeat) {
            alert("Please select a seat before continuing.");
            return;
        }

        /* =========================================================
                     PAYMENT VALIDATION
        ========================================================= */

        const paymentMethod =
            document.getElementById("paymentMethod").value;

        const transferReference =
            document.getElementById("transferReference")?.value.trim() || "";

        const cardName =
            document.getElementById("cardName")?.value.trim() || "";

        const cardNumber =
            document.getElementById("cardNumber")?.value.trim() || "";

        const cardExpiry =
            document.getElementById("cardExpiry")?.value.trim() || "";

        const cardCvv =
            document.getElementById("cardCvv")?.value.trim() || "";


        /* No payment method */

        if (!paymentMethod) {

            alert("Please select a payment method.");

            return;
        }


        /* Transfer validation */

        if (paymentMethod === "Transfer") {

            if (!transferReference) {

                alert(
                    "Please enter the transfer reference after completing the bank transfer."
                );

                document
                    .getElementById("transferReference")
                    ?.focus();

                return;
            }

        }


        /* Card validation */

        if (paymentMethod === "Card") {

            if (
                !cardName ||
                !cardNumber ||
                !cardExpiry ||
                !cardCvv
            ) {

                alert(
                    "Please complete all card payment details."
                );

                return;
            }

        }

        let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
        let buses = JSON.parse(localStorage.getItem("buses")) || [];
        const schedules = JSON.parse(localStorage.getItem("schedules")) || [];
        const selectedRoute = document.getElementById("bookingRoute").value;

        const selectedBus = document.getElementById("bookingBusNumber").value;
        const selectedSchedule = schedules.find(schedule =>
            schedule.routeName === selectedRoute &&
            schedule.busNumber.replace(/\s+/g, "") ===
            selectedBus.replace(/\s+/g, "") &&
            schedule.status !== "Departed" &&
            schedule.status !== "Cancelled"
        );

        if (selectedSchedule) {
            if (selectedSchedule.status === "Departed") {
                alert("This bus has already departed. Booking is no longer available.");
                return;
            }

            if (selectedSchedule.status === "Cancelled") {
                alert("This trip has been cancelled. Please choose another bus.");
                return;
            }

            if (selectedSchedule.status === "Delayed") {
                alert("This bus is delayed. Departure time may change.");
                return;
            }
        }
        const selectedBusData = buses.find(bus => `${bus.busNumber}-${bus.busType}` === selectedBus);
        console.log("Selected Bus:", selectedBus);
        bookings.forEach(booking => {
            console.log(
                booking.selectedBus,
                booking.status
            );
        });

        const currentSchedule = schedules.find(schedule =>
            schedule.routeName.trim() === selectedRoute.trim() &&
            schedule.busNumber.replace(/\s+/g, "") === selectedBus.replace(/\s+/g, "") &&
            !["Departed", "Cancelled"].includes(schedule.status)
        );

        const busBookings = bookings.filter(booking =>
            booking.selectedBus === selectedBus &&
            booking.bookingStatus !== "Cancelled" &&
            booking.departureDate === currentSchedule?.departureDate &&
            booking.departureTime === currentSchedule?.departureTime
        );

        const busSelect = document.getElementById("bookingBusNumber");

        if (busSelect) {
            busSelect.addEventListener("change", updateRemainingSeats);
        }


        if (
            selectedBusData &&
            busBookings.length >= Number(selectedBusData.capacity) &&
            bookingEditIndex === -1
        ) {
            alert("This bus is already full. Please choose another bus.")
            return;
        }


        let seatNumber = document.getElementById("seatNumber").value.trim();

        if (bookingEditIndex !== -1 && !seatNumber) {
            seatNumber = bookings[bookingEditIndex].seatNumber;
        }



        const passengerName = document.getElementById("passengerName").value;
        const passengerPhone = document.getElementById("passengerPhone").value;
        const sponsorName = document.getElementById("sponsorName").value;
        const sponsorPhone = document.getElementById("sponsorPhone").value;
        const busNumber = document.getElementById("bookingBusNumber").value;
        const route = document.getElementById("bookingRoute").value;

        const existingBooking = bookings.find(booking =>
            booking.passengerPhone === passengerPhone &&
            booking.selectedBus === busNumber &&
            booking.bookingStatus === "Active" &&
            booking.departureDate === currentSchedule?.departureDate &&
            booking.departureTime === currentSchedule?.departureTime
        );
        if (existingBooking && bookingEditIndex === -1) {
            alert("Passenger is already booked on this bus");
            return;
        }

        if (passengerPhone.length < 11) {
            alert("Invalid passenger phone number.");
            return;
        }
        if (sponsorPhone.length < 11) {
            alert("Invalid sponsor phone number.");
            return;
        }

        if (!busNumber || !route) {
            alert("Please select a bus and route");
            return;
        }

        const selectedBusKey = document.getElementById("bookingBusNumber").value;


        let paymentStatus = getPaymentStatus();

        const receiptNumber = generateReceiptNumber();
        const passengerEmail = document.getElementById("passengerEmail").value;
        const sponsorEmail = document.getElementById("sponsorEmail").value;
        const gender = document.getElementById("gender").value;
        const state = document.getElementById("bookingState").value;
        const ticketType = document.getElementById("ticketType").value;
        const driverName = document.getElementById("driverName").value;

        const departureDate = document.getElementById("departureDate").value;
        const departureTime = document.getElementById("departureTime").value;

        const booking = {
            bookingId: "BK-" + Date.now(),
            receiptNumber: null,
            state,
            passengerName,
            passengerPhone,
            passengerEmail,

            sponsorName,
            sponsorPhone,
            sponsorEmail,

            gender,
            busNumber,
            busType: selectedBusData.busType,
            route,
            busStatus: selectedSchedule ?
                selectedSchedule.status : "Scheduled",

            paymentMethod: paymentMethod,

            paymentStatus:
                paymentMethod === "Card" && cardPaymentSuccessful
                    ? "Paid"
                    : paymentMethod === "Cash"
                        ? "Pending"
                        : paymentMethod === "Transfer"
                            ? "Pending Verification"
                            : "Pending",

            transactionReference:
                paymentMethod === "Card" && cardPaymentSuccessful
                    ? cardTransactionReference
                    : paymentMethod === "Transfer"
                        ? document.getElementById("transferReference")?.value.trim() || ""
                        : "",

            ticketType,
            kidCount:
                Number(document.getElementById("kidCount")?.value) || 0,
            bookingStatus: "Active",
            selectedBus: selectedBusKey, seatNumber,
            departureDate: document.getElementById("departureDate").value,

            departureTime: document.getElementById("departureTime").value,
            driverName,
            ticketPrice: Number(
                document.getElementById("ticketPrice").value.replace(/[\u20A6,]/g, "")
            ),
            bookingDate: new Date().toLocaleString(),
            bookingCreatedAt: Date.now()

        };

        if (booking.paymentStatus === "Paid") {
            booking.receiptNumber = generateReceiptNumber();
        }

        let currentBookingIndex;
        if (bookingEditIndex === -1) {
            bookings.push(booking);
            currentBookingIndex = bookings.length - 1;

            if (booking.paymentStatus === "Paid") {
                let totalRevenue = Number(localStorage.getItem("totalRevenue")) || 0;
                totalRevenue += Number(booking.ticketPrice);
                localStorage.setItem("totalRevenue", totalRevenue);
            }

        } else {
            booking.updatedAt = new Date().toLocaleString();

            booking.bookingStatus = "Active";

            bookings[bookingEditIndex] = booking;
            currentBookingIndex = bookingEditIndex;

            localStorage.setItem(
                "lastEditedBooking",
                currentBookingIndex
            );

            bookingEditIndex = -1;
        }

        localStorage.setItem("bookings", JSON.stringify(bookings));
        loadNotifyMessage("booking", { passengerName: booking.passengerName, route: booking.route });

        window.dispatchEvent(new Event("storage"));

        if (document.getElementById("bookingPopup")) {
            showBookingPopup(currentBookingIndex);
        }

        loadDashboardStats();

        //calculateRevenue();
        refreshDashboard();
        let activities = JSON.parse(localStorage.getItem("activities")) || [];
        activities.unshift({
            activity: booking.updatedAt
                ? `✏️ Booking Updated for ${booking.passengerName}`
                : `🚐 Booking Created for ${booking.passengerName}`,
            date: booking.updatedAt || new Date().toLocaleString()
        });
        localStorage.setItem("activities", JSON.stringify(activities));

        loadBookings();
        if (typeof loadReports === "function") {
            loadReports();
        }

        const lastEdited = localStorage.getItem("lastEditedBooking");
        if (lastEdited !== null) {
            const row = document.getElementById(`booking-${lastEdited}`);

            if (row) {
                row.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                row.style.backgroundColor = "#fff3cd";

                setTimeout(() => {
                    row.style.backgroundColor = "";
                }, 3000);
            }

            localStorage.removeItem("lastEditedBooking");
        }
        //refreshDashboard
        calculateRevenue();
        updateRemainingSeats();

        setTimeout(() => {
            bookingForm.reset();

            const cashBox = document.getElementById("cashPaymentBox");
            const transferBox = document.getElementById("transferPaymentBox");
            const cardBox = document.getElementById("cardPaymentBox");

            if (cashBox) cashBox.style.display = "none";
            if (transferBox) transferBox.style.display = "none";
            if (cardBox) cardBox.style.display = "none";
            document.getElementById("remainingSeats").textContent = "";
        }, 500);




        document.querySelector("#bookingForm button").textContent = "Add Booking";

        alert(
            bookingEditIndex === -1
                ? "Booking Added Successfully" : "Booking Updated Successfully"
        );

    });
});



function editBookingById(bookingId) {

    if (!bookingId) {
        alert("Booking ID not found.");
        return;
    }

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const booking = bookings.find(
        b => b && String(b.bookingId) === String(bookingId)
    );

    if (!booking) {
        alert("Booking not found.");
        return;
    }

    bookingEditIndex = bookings.findIndex(
        b => b && String(b.bookingId) === String(bookingId)
    );

    loadBookingOptions();

    document.getElementById("passengerName").value =
        booking.passengerName || "";

    document.getElementById("passengerPhone").value =
        booking.passengerPhone || "";

    document.getElementById("sponsorName").value =
        booking.sponsorName || "";

    document.getElementById("sponsorPhone").value =
        booking.sponsorPhone || "";

    document.getElementById("bookingBusNumber").value =
        `${booking.busNumber}-${booking.busType}`;

    if (typeof loadBookingRoutes === "function") {
        loadBookingRoutes();
    }

    document.getElementById("bookingRoute").value =
        booking.route || "";

    document.getElementById("driverName").value =
        booking.driverName || "";

    document.getElementById("ticketPrice").value =
        booking.ticketPrice || "";

    document.getElementById("seatNumber").value =
        booking.seatNumber || "";

    document.getElementById("paymentMethod").value =
        booking.paymentMethod || "";

    document.getElementById("passengerEmail").value =
        booking.passengerEmail || "";

    document.getElementById("sponsorEmail").value =
        booking.sponsorEmail || "";

    document.getElementById("gender").value =
        booking.gender || "";

    document.getElementById("ticketType").value =
        booking.ticketType || "";

    document.getElementById("kidCount").value =
        booking.kidCount || 0;

    updateRemainingSeats();
    loadSeatMap();

    const submitButton =
        document.querySelector("#bookingForm button");

    if (submitButton) {
        submitButton.textContent = "Update Booking";
    }

    document.getElementById("bookingForm").scrollIntoView({
        behavior: "smooth"
    });
}



function cancelBooking(index) {

    if (!confirm("Are you sure you want to cancel your booking?")) {
        return;
    }

    let bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];


    const cancelledBooking = bookings[index];

    if (!cancelledBooking) {
        alert("Booking not found.");
        return;
    }


    // Prevent cancelling an already cancelled booking
    if (cancelledBooking.bookingStatus === "Cancelled") {
        alert("This booking has already been cancelled.");
        return;
    }


    /* =========================================================
       REMOVE REVENUE ONLY IF PAYMENT WAS ALREADY PAID
       ========================================================= */

    if (cancelledBooking.paymentStatus === "Paid") {

        let totalRevenue =
            Number(localStorage.getItem("totalRevenue")) || 0;

        totalRevenue -=
            Number(cancelledBooking.ticketPrice) || 0;

        if (totalRevenue < 0) {
            totalRevenue = 0;
        }

        localStorage.setItem(
            "totalRevenue",
            totalRevenue
        );
    }


    /* =========================================================
       MARK BOOKING AS CANCELLED
       ========================================================= */

    cancelledBooking.bookingStatus = "Cancelled";

    cancelledBooking.seatStatus = "Available";

    cancelledBooking.paymentStatus = "Cancelled";


    bookings[index] = cancelledBooking;


    /* =========================================================
       SAVE BOOKINGS
       ========================================================= */

    localStorage.setItem(
        "bookings",
        JSON.stringify(bookings)
    );




    /* =========================================================
       NOTIFICATION
       ========================================================= */

    if (typeof loadNotifyMessage === "function") {

        loadNotifyMessage("cancel", {
            passengerName:
                cancelledBooking.passengerName
        });

    }


    /* =========================================================
       REFRESH DATA
       ========================================================= */

    if (typeof loadBookings === "function") {
        loadBookings();
    }

    if (typeof refreshDashboard === "function") {
        refreshDashboard();
    }

    if (typeof updateRemainingSeats === "function") {
        updateRemainingSeats();
    }

    if (
        document.getElementById("reportBuses") &&
        typeof loadReports === "function"
    ) {
        loadReports();
    }

    if (typeof loadDashboardStats === "function") {
        loadDashboardStats();
    }


    /* =========================================================
       SHOW ACTIVE BOOKINGS COUNT
       ========================================================= */

    const totalEl =
        document.getElementById("totalBookings");

    if (totalEl) {

        const activeBookings =
            bookings.filter(
                booking =>
                    booking.bookingStatus !== "Cancelled"
            );

        totalEl.textContent =
            activeBookings.length;
    }


    alert("Booking cancelled successfully.");

}

function deleteBooking(index) {

    if (!confirm("Are you sure you want to cancel your booking.")) {
        return;
    }

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    const cancelledBooking = bookings[index];

    if (cancelledBooking.paymentStatus === "Paid") {
        let totalRevenue = Number(localStorage.getItem("totalRevenue")) || 0;

        totalRevenue -= Number(cancelledBooking.ticketPrice);
        if (totalRevenue < 0) {
            totalRevenue = 0;
        }

        localStorage.setItem("totalRevenue", totalRevenue);
    }

    bookings.splice(index, 1);

    localStorage.setItem("bookings", JSON.stringify(bookings));

    loadBookings();
    refreshDashboard();
    //calculateRevenue();
    updateRemainingSeats();

    const totalEl = document.getElementById("totalBookings");
    if (totalEl) {
        totalEl.textContent = bookings.length;
    }

}

function showBookingPopup(index) {
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    let booking = bookings[index];

    document.getElementById("popupDetails").innerHTML = `
        BOOKING SUCCESSFUL
        
       <p><b>Booking ID:</b> ${booking.bookingId}</p>
        ${booking.receiptNumber ? `<p><b>Receipt Number:</b> ${booking.receiptNumber}</p>` : ''}
        <p><b>State:</b> ${booking.state}</p>
        <p><b>Passenger Name:</b> ${booking.passengerName}</p>
        <p><b>Passenger Phone:</b> ${booking.passengerPhone}</p>
        <p><b>Passenger Email:</b> ${booking.passengerEmail}<p>
        <p><b>Sponsor Name:</b> ${booking.sponsorName}<p>
        <p><b>Sponsor Phone:</b> ${booking.sponsorPhone}<p>
        <p><b>Sponsor Email:</b> ${booking.sponsorEmail}<p>
        <p><b>Gender:</b> ${booking.gender}<p>
        <p><b>Number of Kids:</b> ${booking.kidCount || 0}</p>
        <p><b>Bus: </b>${booking.busNumber}<p>
        <p><b>Route:</b> ${booking.route}<p>
        <p><b>Payment Method: </b>${booking.paymentMethod}<p>
        <p><b>Payment Status:</b> ${booking.paymentStatus}<p>
        <p><b>Ticket Type:</b>${booking.ticketType}<p>
        <p><b>Seat:</b> ${booking.seatNumber}<p>
        <p><b>Departure Date:</b> ${booking.departureDate}<p>
        <p><b>Departure Time:</b> ${to12Hour(booking.departureTime)}<p>
        <p><b>Driver Name:</b> ${booking.driverName}</p>
        <p><b>Ticket Price:</b>\u20A6${booking.ticketPrice.toLocaleString()}<p>
        <p><b>Booking Date:</b> ${booking.bookingDate}<p>
    `;

    document.getElementById("bookingPopup").style.display = "block";

    document.getElementById("printBtn").onclick = function () {
        printBookingSlip(index);
        document.getElementById("bookingPopup").style.display = "none";

    };

    document.getElementById("emailTicketBtn").onclick = function () {
        emailBookingTicket(index);
        document.getElementById("bookingPopup").style.display = "none";
    };

    document.getElementById("editBtn").onclick = function () {
        editBooking(index);

        document.getElementById("bookingPopup").style.display = "none";
    };

    document.getElementById("closeBtn").onclick = function () {

        deleteBooking(index);
        document.getElementById("bookingPopup").style.display = "none";
    };

}




function emailBookingTicket(index) {

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const booking = bookings[index];

    if (!booking) {
        alert("Booking not found.");
        return;
    }

    const bookingStatus =
        String(booking.bookingStatus || "")
            .trim()
            .toLowerCase();

    if (
        bookingStatus === "cancelled" ||
        bookingStatus === "expired"
    ) {
        alert(
            "This booking cannot be emailed because it is " +
            booking.bookingStatus.toLowerCase() + "."
        );
        return;
    }

    const passengerEmail =
        String(booking.passengerEmail || "").trim();

    if (!passengerEmail) {
        alert(
            "No passenger email is available for this booking."
        );
        return;
    }

    /*
     * BACKEND EMAIL PLACEHOLDER
     *
     * The booking and passenger email have been validated.
     * The real backend email request will be added here later.
     */

    alert(
        "Email ticket is ready for " +
        passengerEmail +
        ".\n\n" +
        "Email sending will be connected when the backend is added."
    );
}

function printBookingSlip(index) {

    const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const booking = bookings[index];


    const slip = `
    <style>
    body{
        font-family: Arial;
        padding:20px;
        text-align:center;
    }
    p{
      text-align:left;
      margin:10px 0;
    }
    hr{
       margin:20px 0;
    }
    </style>

        <h2>TRANSNOVA EXPRESS PASSENGER SLIP</h2>
        <hr>
        
        <p><strong>Booking ID:</strong>${booking.bookingId}</p>
        <p><strong>State:</strong> ${booking.state}</p>
        <p><strong>Passenger Name:</strong>${booking.passengerName}</p>
        <p><strong>Passenger Phone:</strong>${booking.passengerPhone}</p>
        <p><strong>Number of Kids:</strong>${booking.kidCount || 0}</p>
        <p><strong>Sponsor Name:</strong>${booking.sponsorName}</p>
        <p><strong>Sponsor Phone:</strong>${booking.sponsorPhone}</p>
        <p><strong>Bus:</strong>${booking.busNumber}</p>
        <p><strong>Route:</strong>${booking.route}</p>
        <p><strong>Payment Method: </strong>${booking.paymentMethod}<p>
        <p><strong>Payment Status:</strong> ${booking.paymentStatus}<p>
        <p><strong>Booking Date:</strong>${booking.bookingDate}</p>
        <p><strong>Departure Date:</strong>${booking.departureDate}</p>
        <p><strong>Departure Time:</strong>${to12Hour(booking.departureTime)}</p>
        <p><strong>Driver Name:</strong> ${booking.driverName}</p>
        <p><strong>Ticket Price:</strong>${Number(booking.ticketPrice)}</p>
        <hr>
        <p>
            Please arrive at the terminal at least 30 minutes before the scheduled departure time to collect your complete receipt and finalize boarding procedures.
        </p>
        `;

    const printWindow = window.open("", "", "width=600,height=700");
    printWindow.document.write(slip);
    printWindow.document.close();
    printWindow.print();
}


//=================
//Ticket Section
//=================



document.addEventListener("DOMContentLoaded", () => {

    const ticketBooking =
        document.getElementById("ticketBooking");

    const ticketBtn =
        document.getElementById("generateTicket");

    if (ticketBooking) {

        const selectedPassenger =
            localStorage.getItem("selectedPassenger");

        const bookings =
            JSON.parse(localStorage.getItem("bookings")) || [];

        const activeBooking = bookings.find(booking => {

            const passengerName =
                (booking.passengerName || "")
                    .trim()
                    .toLowerCase();

            const selectedName =
                (selectedPassenger || "")
                    .trim()
                    .toLowerCase();

            const isActive =
                booking.bookingStatus !== "Cancelled" &&
                booking.bookingStatus !== "Expired";

            return (
                selectedPassenger &&
                passengerName === selectedName &&
                isActive
            );
        });

        if (activeBooking) {

            // Passenger came from the booking details arrow
            ticketBooking.value =
                activeBooking.passengerName;

        } else {

            // Directly opened ticket page
            ticketBooking.value = "";

            ticketBooking.placeholder =
                "No passenger selected";

            // Prevent old passenger from appearing again
            localStorage.removeItem("selectedPassenger");
            localStorage.removeItem("selectedPassengerName");
        }
    }

    if (!ticketBtn) return;

    ticketBtn.addEventListener("click", generateTicket);
});

let ticketGenerated = false;

function generateTicket() {

    const passengerName = localStorage.getItem("selectedPassengerName");

    if (!passengerName) {
        alert("Please select a booking.");
        return;
    }

    //const bookingIndex = document.getElementById("ticketBooking").value;

    const bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    const booking = bookings.find(b => {

        const samePassenger =
            (b.passengerName || "").trim().toLowerCase() ===
            passengerName.trim().toLowerCase();

        const activeBooking =
            b.bookingStatus !== "Cancelled" &&
            b.bookingStatus !== "Expired";

        return samePassenger && activeBooking;
    });

    if (!booking) {
        alert("Booking not found.");
        return;
    }

    document.getElementById("ticketBookingId").textContent = booking.bookingId;
    document.getElementById("ticketNumber").textContent = booking.receiptNumber;
    document.getElementById("passengerState").textContent = booking.state;
    document.getElementById("ticketPassenger").textContent = booking.passengerName;
    document.getElementById("ticketPassengerPhone").textContent = booking.passengerPhone;
    document.getElementById("ticketPassengerEmail").textContent = booking.passengerEmail;
    document.getElementById("ticketSponsor").textContent = booking.sponsorName;
    document.getElementById("ticketSponsorPhone").textContent = booking.sponsorPhone;
    document.getElementById("ticketSponsorEmail").textContent = booking.sponsorEmail;
    document.getElementById("ticketPassengerGender").textContent = booking.gender;
    document.getElementById("ticketKidCount").textContent = booking.kidCount || 0;
    document.getElementById("ticketBus").textContent = booking.busNumber;
    document.getElementById("ticketRoute").textContent = booking.route;
    document.getElementById("ticketPaymentMethod").textContent = booking.paymentMethod;
    document.getElementById("ticketPaymentStatus").textContent = booking.paymentStatus;
    document.getElementById("passengerTicketType").textContent = booking.ticketType;
    document.getElementById("ticketSeat").textContent = booking.seatNumber;
    document.getElementById("ticketDepartureDate").textContent = booking.departureDate;
    document.getElementById("ticketdepartureTime").textContent = to12Hour(booking.departureTime);
    document.getElementById("ticketDriverName").textContent = booking.driverName;
    document.getElementById("ticketFare").textContent = booking.ticketPrice;
    document.getElementById("ticketDate").textContent = booking.bookingDate;

    document.getElementById("ticketCard").style.display = "block";
    ticketGenerated = true;
}

function printTicket() {

    if (!ticketGenerated) {
        alert("Please generate the ticket before printing.");
        return;
    }

    window.print();
}

function goBack() {
    history.back();
}

//=======================
//Platform Section
//======================
let bayEditIndex = -1

function loadBusOptionsForBay() {
    const busSelect =
        document.getElementById("assignedBus");

    const state =
        document.getElementById("bayState").value;

    if (!busSelect) return;

    busSelect.innerHTML = `
        <option value="">Select Bus (optional)</option>
    `;

    let buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let visibleBuses = buses;

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        visibleBuses =
            buses.filter(bus =>
                String(bus.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );
    }

    visibleBuses
        .filter(bus =>
            String(bus.state || "")
                .trim()
                .toLowerCase() ===
            String(state || "")
                .trim()
                .toLowerCase()
        )
        .forEach(bus => {
            busSelect.innerHTML += `
                <option value="${bus.busNumber} - ${bus.busType}">
                    ${bus.busNumber} - ${bus.busType}
                </option>
            `;
        });
}

// function loadBusOptionsForBay() {
//     const busSelect = document.getElementById("assignedBus");
//     const state = document.getElementById("bayState").value;

//     if (!busSelect) return;

//     busSelect.innerHTML = `
//     <option value="">Select Bus (optional)</option>`;

//     let buses = JSON.parse(localStorage.getItem("buses")) || [];

//     buses
//         .filter(bus => bus.state === state)
//         .forEach(bus => {
//             busSelect.innerHTML += `
//             <option value="${bus.busNumber} - ${bus.busType}">
//                 ${bus.busNumber} - ${bus.busType}
//             </option>
//         `;
//         });
// }

function loadStateForBay() {
    const stateSelect = document.getElementById("bayState");

    if (!stateSelect) return;

    let buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let states = [
        ...new Set(
            buses
                .map(bus => bus.state)
                .filter(state => state)
        )
    ];

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        states = states.filter(state =>
            String(state || "")
                .trim()
                .toLowerCase() === assignedState
        );
    }

    stateSelect.innerHTML =
        '<option value="">Select State</option>';

    states.forEach(state => {
        stateSelect.innerHTML += `
            <option value="${state}">
                ${state}
            </option>
        `;
    });
}

// function loadStateForBay() {
//     const stateSelect = document.getElementById("bayState");

//     if (!stateSelect) return;

//     let buses = JSON.parse(localStorage.getItem("buses")) || [];

//     const states = [...new Set(buses.map(bus => bus.state)
//     )];
//     stateSelect.innerHTML = '<option value="">Select State</option>';
//     states.forEach(state => {
//         stateSelect.innerHTML += `
//             <option value="${state}">
//                 ${state}
//             </option>
//         `;
//     });
// }


document.addEventListener("DOMContentLoaded", () => {
    const bayForm = document.getElementById("bayForm");
    const bayState = document.getElementById("bayState");

    if (bayState) {
        bayState.addEventListener("change", loadBusOptionsForBay);
    }


    if (!bayForm) {
        return;
    }
    loadStateForBay();
    loadBusOptionsForBay();
    loadBays();


    const searchBay = document.getElementById("searchBay");
    if (searchBay) {
        searchBay.addEventListener("input", loadBays);
    }

    bayForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const assignedBus =
            document.getElementById("assignedBus").value;

        const bayState =
            document.getElementById("bayState").value;

        const currentUser =
            JSON.parse(localStorage.getItem("currentUser"));

        if (
            currentUser &&
            currentUser.role === "staff"
        ) {
            const assignedState =
                String(currentUser.state || "")
                    .trim()
                    .toLowerCase();

            const selectedState =
                String(bayState || "")
                    .trim()
                    .toLowerCase();

            if (selectedState !== assignedState) {
                alert(
                    "Access Denied! You can only manage bays in your assigned state."
                );
                return;
            }

            if (assignedBus) {
                const buses =
                    JSON.parse(localStorage.getItem("buses")) || [];

                const selectedBus =
                    buses.find(bus =>
                        `${bus.busNumber} - ${bus.busType}` ===
                        assignedBus
                    );

                const busState =
                    String(selectedBus?.state || "")
                        .trim()
                        .toLowerCase();

                if (!selectedBus || busState !== assignedState) {
                    alert(
                        "Access Denied! You can only assign buses from your assigned state."
                    );
                    return;
                }
            }
        }

        const bay = {
            state: bayState,
            bayNumber:
                document.getElementById("bayNumber").value,
            status: assignedBus ? "Occupied" : "Available",
            assignedBus: assignedBus
        };



        // const assignedBus = document.getElementById("assignedBus").value;

        // const bay = {
        //     state: document.getElementById("bayState").value,
        //     bayNumber: document.getElementById("bayNumber").value,
        //     status: assignedBus ? "Occupied" : "Available",
        //     assignedBus: assignedBus
        // };

        let bays = JSON.parse(localStorage.getItem("bays")) || [];

        if (
            assignedBus &&
            bays.some(
                (b, index) =>
                    normalizeBusKey(b.assignedBus || "") ===
                    normalizeBusKey(assignedBus) &&
                    index !== bayEditIndex
            )
        ) {
            alert(
                "This bus is already assigned to another bay. Release its previous bay before assigning it here."
            );
            return;
        }
        // if (
        //     assignedBus &&
        //     bays.some(
        //         (b, index) =>
        //             b.assignedBus === assignedBus &&
        //             index !== bayEditIndex
        //     )
        // ) {
        //     alert("This bus is already assigned to another bay this state.");
        //     return;
        // }

        if (
            bays.some((b, index) =>
                b.state === bay.state &&
                b.bayNumber === bay.bayNumber &&
                index !== bayEditIndex)
        ) {
            alert("This bay already exists.");
            return;
        }

        if (bayEditIndex === -1) {
            bays.push(bay);
        } else {
            bays[bayEditIndex] = bay;
            bayEditIndex = -1;

            document.querySelector("#bayForm button").textContent = "Add Bay";
        }

        localStorage.setItem("bays", JSON.stringify(bays));

        refreshDashboard();
        bayForm.reset();
        loadBays();
    });
});


function loadBays() {
    const tableBody =
        document.getElementById("bayTableBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    let bays =
        JSON.parse(localStorage.getItem("bays")) || [];

    let schedules =
        JSON.parse(localStorage.getItem("schedules")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let visibleBays = bays;

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        visibleBays =
            bays.filter(bay =>
                String(bay.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );
    }

    /* =========================
       BAY COUNTERS
    ========================= */

    const totalBays =
        visibleBays.length;

    let assignedCount = 0;
    let occupiedCount = 0;

    const now = new Date();

    /* =========================
       CALCULATE BAY COUNTERS
    ========================= */

    visibleBays.forEach(bay => {

        if (!bay.assignedBus) {
            return;
        }

        assignedCount++;

        const activeSchedule =
            schedules.find(schedule => {

                const sameBus =
                    schedule.busNumber ===
                    bay.assignedBus;

                const sameState =
                    schedule.state ===
                    bay.state;

                const departure =
                    new Date(
                        schedule.departureDate +
                        "T" +
                        schedule.departureTime
                    );

                const scheduleIsActive =
                    ![
                        "Departed",
                        "Cancelled"
                    ].includes(schedule.status) &&
                    now < departure;

                return (
                    sameBus &&
                    sameState &&
                    scheduleIsActive
                );
            });

        if (activeSchedule) {
            occupiedCount++;
        }
    });

    const availableCount =
        totalBays - occupiedCount;

    /* =========================
       UPDATE COUNTERS
    ========================= */

    const totalBaysElement =
        document.getElementById("totalBays");

    const availableBaysElement =
        document.getElementById("availableBays");

    const assignedBaysElement =
        document.getElementById("assignedBays");

    const occupiedBaysElement =
        document.getElementById("occupiedBays");

    if (totalBaysElement) {
        totalBaysElement.textContent =
            totalBays;
    }

    if (availableBaysElement) {
        availableBaysElement.textContent =
            availableCount;
    }

    if (assignedBaysElement) {
        assignedBaysElement.textContent =
            assignedCount;
    }

    if (occupiedBaysElement) {
        occupiedBaysElement.textContent =
            occupiedCount;
    }

    /* =========================
       NO BAYS
    ========================= */

    if (visibleBays.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;">
                    No bays available
                </td>
            </tr>
        `;

        return;
    }

    /* =========================
       SEARCH
    ========================= */

    const searchValue =
        document.getElementById("searchBay")
            ?.value
            .toLowerCase()
            .trim() || "";

    /* =========================
       DISPLAY BAY RECORDS
    ========================= */

    visibleBays
        .filter(bay =>
            (bay.bayNumber || "")
                .toLowerCase()
                .includes(searchValue)

            ||

            (bay.status || "")
                .toLowerCase()
                .includes(searchValue)

            ||

            (bay.assignedBus || "")
                .toLowerCase()
                .includes(searchValue)

            ||

            (bay.state || "")
                .toLowerCase()
                .includes(searchValue)
        )
        .forEach(bay => {

            const originalIndex =
                bays.indexOf(bay);

            /* =========================
               BAY STATUS
            ========================= */

            let bayStatus =
                "Available";

            /* =========================
               BUS STATUS
            ========================= */

            let busStatus =
                "⚪ No Bus Assigned";

            if (bay.assignedBus) {

                busStatus =
                    "⚪ Not Scheduled";

                const matchingSchedules =
                    schedules.filter(schedule =>
                        schedule.busNumber ===
                        bay.assignedBus &&
                        schedule.state ===
                        bay.state
                    );

                const cancelledSchedule =
                    matchingSchedules.find(
                        schedule =>
                            schedule.status ===
                            "Cancelled"
                    );

                const departedSchedule =
                    matchingSchedules.find(
                        schedule =>
                            schedule.status ===
                            "Departed"
                    );

                const activeSchedule =
                    matchingSchedules.find(
                        schedule => {

                            const departure =
                                new Date(
                                    schedule.departureDate +
                                    "T" +
                                    schedule.departureTime
                                );

                            return (
                                ![
                                    "Departed",
                                    "Cancelled"
                                ].includes(
                                    schedule.status
                                ) &&
                                now < departure
                            );
                        }
                    );

                if (activeSchedule) {

                    busStatus =
                        "🟢 Active";

                    bayStatus =
                        "Occupied";

                }
                else if (departedSchedule) {

                    busStatus =
                        "🔴 Departed";

                    bayStatus =
                        "Available";

                }
                else if (cancelledSchedule) {

                    busStatus =
                        "⚫ Cancelled";

                    bayStatus =
                        "Available";
                }
            }

            /* =========================
               TABLE ROW
            ========================= */

            tableBody.innerHTML += `
                <tr>

                    <td>
                        ${bay.state}
                    </td>

                    <td>
                        ${bay.bayNumber}
                    </td>

                    <td>
                        ${bayStatus}
                    </td>

                    <td>
                        ${bay.assignedBus || "None"}
                    </td>

                    <td>
                        ${busStatus}
                    </td>

                    <td>

                        <button
                            onclick="editBay(${originalIndex})"
                            class="edit-btn">
                            Edit
                        </button>

                        <button
                            onclick="deleteBay(${originalIndex})"
                            class="delete-btn">
                            Delete
                        </button>

                    </td>

                </tr>
            `;
        });

    if (!tableBody.innerHTML.trim()) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;">
                    No matching bays found
                </td>
            </tr>
        `;
    }
}


function deleteBay(index) {
    if (!confirm("Delete this Bay?")) return;

    let bays = JSON.parse(localStorage.getItem("bays")) || [];

    bays.splice(index, 1);

    localStorage.setItem("bays", JSON.stringify(bays));

    refreshDashboard();
    loadBays();
}

function editBay(index) {
    const bays =
        JSON.parse(localStorage.getItem("bays")) || [];

    const bay = bays[index];

    if (!bay) {
        alert("Bay not found. Please refresh the page and try again.");
        return;
    }

    const bayState =
        document.getElementById("bayState");

    const bayNumber =
        document.getElementById("bayNumber");

    const bayStatus =
        document.getElementById("bayStatus");

    const assignedBus =
        document.getElementById("assignedBus");

    bayState.value = bay.state;

    loadBusOptionsForBay();

    bayNumber.value = bay.bayNumber;
    bayStatus.value = bay.status;
    assignedBus.value = bay.assignedBus || "";

    bayEditIndex = index;

    const submitButton =
        document.querySelector("#bayForm button[type='submit']");

    if (submitButton) {
        submitButton.innerHTML =
            `<i class="fa-solid fa-pen"></i> Update Bay`;
    }
}

/* =========================================================
   BUS MOVEMENT SYSTEM
   ========================================================= */

function normalizeBusKey(value) {
    return String(value || "")
        .replace(/\s+/g, "")
        .toLowerCase();
}


/* =========================================================
   PROCESS BUS MOVEMENTS
   ========================================================= */

function processBusMovements() {

    let buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    let schedules =
        JSON.parse(localStorage.getItem("schedules")) || [];

    let routes =
        JSON.parse(localStorage.getItem("routes")) || [];


    if (buses.length === 0 || schedules.length === 0) {
        return;
    }


    const now = new Date();

    let busesUpdated = false;
    let schedulesUpdated = false;


    schedules.forEach(schedule => {

        /*
         * Cancelled schedules must never move a bus.
         */
        if (schedule.status === "Cancelled") {
            return;
        }


        /*
         * A schedule that has already been confirmed
         * as arrived must not start moving again.
         */
        if (schedule.arrivalStatus === "Arrived") {
            return;
        }


        /*
         * Make sure the schedule has departure
         * information.
         */
        if (
            !schedule.departureDate ||
            !schedule.departureTime
        ) {
            return;
        }


        const departureDateTime =
            new Date(
                `${schedule.departureDate}T${schedule.departureTime}`
            );


        if (isNaN(departureDateTime.getTime())) {
            return;
        }


        /*
         * Departure time has not been reached yet.
         */
        if (now < departureDateTime) {
            return;
        }


        /*
         * Find the physical bus.
         */
        const scheduleBusKey =
            normalizeBusKey(schedule.busNumber);


        const bus =
            buses.find(bus =>
                normalizeBusKey(
                    `${bus.busNumber}-${bus.busType}`
                ) === scheduleBusKey
            );


        /*
         * If the bus cannot be found,
         * do nothing.
         */
        if (!bus) {
            return;
        }


        /*
         * If this bus is already travelling,
         * do not start another movement.
         */
        if (bus.movementStatus === "In Transit") {
            return;
        }


        /*
         * Only an available bus can begin
         * a new journey.
         */
        if (
            bus.movementStatus &&
            bus.movementStatus !== "Available"
        ) {
            return;
        }


        /*
         * Find the route connected to this schedule.
         */
        const route =
            routes.find(route =>
                route.routeName === schedule.routeName &&
                route.busType === schedule.busNumber
            );


        /*
         * A destination is required.
         */
        if (!route || !route.destination) {
            return;
        }


        /*
         * Origin terminal.
         */
        const originState =
            schedule.state ||
            bus.state ||
            "";


        /*
         * Create a unique movement ID if
         * the schedule does not already have one.
         */
        const activeScheduleId =
            schedule.activeScheduleId ||
            schedule.scheduleId ||
            `${schedule.busNumber}-${schedule.departureDate}-${schedule.departureTime}`;


        /*
         * =========================================
         * UPDATE BUS
         * =========================================
         */

        bus.movementStatus =
            "In Transit";

        bus.currentLocation =
            originState;

        bus.state =
            originState;

        bus.destination =
            route.destination;

        bus.activeScheduleId =
            activeScheduleId;


        /*
         * =========================================
         * UPDATE SCHEDULE
         * =========================================
         */

        schedule.movementStatus =
            "In Transit";

        schedule.arrivalStatus =
            "Pending";

        schedule.originState =
            originState;

        schedule.destinationState =
            route.destination;

        schedule.activeScheduleId =
            activeScheduleId;

        schedule.status =
            "Departed";

        schedule.manualStatus =
            true;

        schedule.updatedAt =
            new Date().toLocaleString();


        busesUpdated = true;
        schedulesUpdated = true;


        /*
         * Notification.
         */
        if (typeof loadNotifyMessage === "function") {
            loadNotifyMessage("departed", {
                busNumber: schedule.busNumber,
                originState: originState,
                destinationState: route.destination
            });
        }




    });


    /*
     * Save updated buses.
     */
    if (busesUpdated) {

        localStorage.setItem(
            "buses",
            JSON.stringify(buses)
        );

    }


    /*
     * Save updated schedules.
     */
    if (schedulesUpdated) {

        localStorage.setItem(
            "schedules",
            JSON.stringify(schedules)
        );

    }

}


/* =========================================================
   LOAD INCOMING BUSES
   ========================================================= */

function loadIncomingBuses() {

    const tableBody =
        document.getElementById("incomingBusTableBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";


    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));


    const schedules =
        JSON.parse(localStorage.getItem("schedules")) || [];


    const isAdmin =
        currentUser?.role === "admin";


    const staffState =
        currentUser?.state || "";


    const searchInput =
        document.getElementById("searchIncomingBus");


    const searchValue =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    const incomingBuses =
        schedules.filter(schedule => {

            /*
             * Only buses currently travelling.
             */
            if (
                schedule.movementStatus !== "In Transit"
            ) {
                return false;
            }


            /*
             * Only movements waiting for arrival.
             */
            if (
                schedule.arrivalStatus !== "Pending"
            ) {
                return false;
            }


            /*
             * Destination must exist.
             */
            if (!schedule.destinationState) {
                return false;
            }


            /*
             * Staff can only see buses arriving
             * at their own terminal.
             */
            if (
                !isAdmin &&
                schedule.destinationState !== staffState
            ) {
                return false;
            }


            const searchText = [

                schedule.busNumber,
                schedule.routeName,
                schedule.originState,
                schedule.destinationState

            ]
                .join(" ")
                .toLowerCase();


            return searchText.includes(searchValue);

        });


    /*
     * No incoming buses.
     */
    if (incomingBuses.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    No incoming buses.
                </td>
            </tr>
        `;

        return;
    }


    /*
     * Display incoming buses.
     */
    incomingBuses.forEach(schedule => {

        const origin =
            schedule.originState ||
            schedule.state ||
            "-";


        const destination =
            schedule.destinationState ||
            "-";


        const expectedArrival =
            schedule.expectedArrivalDate
                ? `${schedule.expectedArrivalDate} ${to12Hour(schedule.expectedArrivalTime)}`
                : "N/A";


        tableBody.innerHTML += `
            <tr>

                <td>
                    ${schedule.busNumber}
                </td>

                <td>
                    ${origin}
                </td>

                <td>
                    ${schedule.routeName || "-"}
                </td>

                <td>
                    ${destination}
                </td>

                <td>
                    ${to12Hour(schedule.departureTime)}
                </td>

                <td>
                    ${expectedArrival}
                </td>

                <td>
                    <span class="incoming-status">
                        🚌 In Transit
                    </span>
                </td>

                <td>

                    <button
                        type="button"
                        class="arrival-btn"
                        onclick="confirmBusArrival('${encodeURIComponent(
            schedule.activeScheduleId || ""
        )}')">

                        <i class="fa-solid fa-circle-check"></i>

                        Confirm Arrival

                    </button>

                </td>

            </tr>
        `;

    });

}


/* =========================================================
   CONFIRM BUS ARRIVAL
   ========================================================= */

function confirmBusArrival(encodedScheduleId) {

    const scheduleId =
        decodeURIComponent(encodedScheduleId);


    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));


    if (!currentUser) {

        alert("Please log in first.");

        return;
    }


    let buses =
        JSON.parse(localStorage.getItem("buses")) || [];


    let schedules =
        JSON.parse(localStorage.getItem("schedules")) || [];


    const scheduleIndex =
        schedules.findIndex(schedule =>
            (
                schedule.activeScheduleId ||
                ""
            ) === scheduleId
        );


    if (scheduleIndex === -1) {

        alert(
            "Incoming bus movement could not be found."
        );

        return;
    }


    const schedule =
        schedules[scheduleIndex];


    if (schedule.arrivalStatus !== "Pending") {

        alert(
            "This bus has already been processed."
        );

        return;
    }


    const destination =
        schedule.destinationState;


    if (!destination) {

        alert(
            "The destination terminal for this bus could not be determined."
        );

        return;
    }


    /*
     * Staff security.
     */
    if (
        currentUser.role !== "admin" &&
        currentUser.state !== destination
    ) {

        alert(
            "Access Denied! This bus is arriving at " +
            destination +
            "."
        );

        return;
    }


    /*
     * Find physical bus.
     */
    const busIndex =
        buses.findIndex(bus =>
            normalizeBusKey(
                `${bus.busNumber}-${bus.busType}`
            ) ===
            normalizeBusKey(
                schedule.busNumber
            )
        );


    if (busIndex === -1) {

        alert("The bus could not be found.");

        return;
    }


    const bus =
        buses[busIndex];


    /*
     * Bus must still be in transit.
     */
    if (bus.movementStatus !== "In Transit") {

        alert(
            "This bus is no longer marked as In Transit."
        );

        return;
    }

    /*
 * RELEASE BUS FROM ORIGIN BAY
 */

    let bays =
        JSON.parse(localStorage.getItem("bays")) || [];

    const originState =
        String(schedule.originState || "")
            .trim()
            .toLowerCase();

    const busKey =
        normalizeBusKey(schedule.busNumber);

    bays.forEach(bay => {
        const bayState =
            String(bay.state || "")
                .trim()
                .toLowerCase();

        const assignedBusKey =
            normalizeBusKey(bay.assignedBus || "");

        if (
            bayState === originState &&
            assignedBusKey === busKey
        ) {
            bay.assignedBus = "";
            bay.status = "Available";
        }
    });

    localStorage.setItem(
        "bays",
        JSON.stringify(bays)
    );


    /*
     * =========================================
     * MOVE BUS TO DESTINATION
     * =========================================
     */

    bus.state =
        destination;

    bus.currentLocation =
        destination;

    bus.movementStatus =
        "Available";

    bus.destination =
        null;

    bus.activeScheduleId =
        null;


    /*
     * =========================================
     * COMPLETE MOVEMENT RECORD
     * =========================================
     */

    const arrivalNow =
        new Date();


    schedule.arrivalStatus =
        "Arrived";

    schedule.arrivalConfirmedAt =
        arrivalNow.toLocaleString();

    schedule.actualArrivalDate =
        arrivalNow.toISOString().split("T")[0];

    schedule.actualArrivalTime =
        arrivalNow.toTimeString().slice(0, 5);

    schedule.arrivalConfirmedBy =
        currentUser.username ||
        currentUser.fullName ||
        "System";

    schedule.movementStatus =
        "Arrived";

    schedule.updatedAt =
        arrivalNow.toLocaleString();


    /*
     * Save everything.
     */
    localStorage.setItem(
        "buses",
        JSON.stringify(buses)
    );


    localStorage.setItem(
        "schedules",
        JSON.stringify(schedules)
    );


    /*
     * Refresh both movement sections.
     */
    loadIncomingBuses();
    loadMovementHistory();


    /*
     * Refresh dashboard.
     */
    if (
        typeof refreshDashboard === "function"
    ) {

        refreshDashboard();

    }


    /*
     * Notification.
     */


    if (typeof loadNotifyMessage === "function") {
        loadNotifyMessage("arrival", {
            busNumber: schedule.busNumber,
            originState: schedule.originState,
            destinationState: schedule.destinationState,
            confirmedBy:
                currentUser.username ||
                currentUser.fullName ||
                "System"
        });
    }



    alert(
        schedule.busNumber +
        " has arrived at " +
        destination +
        " terminal."
    );

}


/* =========================================================
   MOVEMENT HISTORY
   ========================================================= */

function loadMovementHistory() {

    const tableBody =
        document.getElementById(
            "movementHistoryTableBody"
        );


    if (!tableBody) return;


    tableBody.innerHTML = "";


    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    const schedules =
        JSON.parse(
            localStorage.getItem("schedules")
        ) || [];


    const isAdmin =
        currentUser?.role === "admin";


    const staffState =
        currentUser?.state || "";


    const searchInput =
        document.getElementById(
            "searchMovementHistory"
        );


    const searchValue =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    const completedMovements =
        schedules.filter(schedule => {

            if (
                schedule.arrivalStatus !== "Arrived"
            ) {
                return false;
            }


            /*
             * Staff sees only movements that
             * arrived at their terminal.
             */
            if (
                !isAdmin &&
                schedule.destinationState !== staffState
            ) {
                return false;
            }


            const searchText = [

                schedule.busNumber,
                schedule.routeName,
                schedule.originState,
                schedule.destinationState,
                schedule.arrivalConfirmedBy

            ]
                .join(" ")
                .toLowerCase();


            return searchText.includes(searchValue);

        });


    /*
     * No completed movements.
     */
    if (completedMovements.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    No completed movement records.
                </td>
            </tr>
        `;

        return;
    }


    /*
     * Latest arrival first.
     */
    completedMovements
        .slice()
        .reverse()
        .forEach(schedule => {

            const origin =
                schedule.originState ||
                schedule.state ||
                "-";


            const destination =
                schedule.destinationState ||
                "-";


            const expectedArrival =
                schedule.expectedArrivalDate
                    ? `${schedule.expectedArrivalDate} ${to12Hour(schedule.expectedArrivalTime)}`
                    : "N/A";


            const actualArrival =
                schedule.actualArrivalDate
                    ? `${schedule.actualArrivalDate} ${to12Hour(schedule.actualArrivalTime)}`
                    : "N/A";


            tableBody.innerHTML += `
                <tr>

                    <td>
                        ${schedule.busNumber}
                    </td>

                    <td>
                        ${origin}
                    </td>

                    <td>
                        ${schedule.routeName || "-"}
                    </td>

                    <td>
                        ${destination}
                    </td>

                    <td>
                        ${schedule.departureDate || "-"}
                        ${schedule.departureTime
                    ? to12Hour(
                        schedule.departureTime
                    )
                    : ""
                }
                    </td>

                    <td>
                        ${expectedArrival}
                    </td>

                    <td>
                        ${actualArrival}
                    </td>

                    <td>
                        ${schedule.arrivalConfirmedBy ||
                "System"
                }
                    </td>

                </tr>
            `;

        });

}


/* =========================================================
   PLATFORM PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /*
     * Process buses immediately when the
     * Platform page opens.
     */
    processBusMovements();


    /*
     * Load movement tables.
     */
    loadIncomingBuses();
    loadMovementHistory();


    /*
     * Incoming bus search.
     */
    const searchIncomingBus =
        document.getElementById(
            "searchIncomingBus"
        );


    if (searchIncomingBus) {

        searchIncomingBus.addEventListener(
            "input",
            loadIncomingBuses
        );

    }


    /*
     * Movement history search.
     */
    const searchMovementHistory =
        document.getElementById(
            "searchMovementHistory"
        );


    if (searchMovementHistory) {

        searchMovementHistory.addEventListener(
            "input",
            loadMovementHistory
        );

    }


    /*
     * Continue checking for buses that
     * have reached their departure time.
     */
    setInterval(() => {

        processBusMovements();

        loadIncomingBuses();

        loadMovementHistory();

    }, 30000);

});

//===================
//Staff section
//==================

/* =========================================================
   STAFF & DRIVER MANAGEMENT
   ========================================================= */

let staffEditIndex = -1;
let driverEditIndex = -1;


/* =========================================================
   LOAD STATES FOR TERMINAL STAFF
   ========================================================= */

function loadStaffStates() {

    const stateSelect =
        document.getElementById("staffState");

    if (!stateSelect) return;

    const buses =
        JSON.parse(localStorage.getItem("buses")) || [];
    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let states = [
        ...new Set(
            buses
                .map(bus => bus.state)
                .filter(state => state)
        )
    ];

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "").trim().toLowerCase() === "manager"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        states = states.filter(state =>
            String(state || "")
                .trim()
                .toLowerCase() === assignedState
        );
    }

    stateSelect.innerHTML = `
        <option value="">
            Select State / Terminal
        </option>
    `;

    states.forEach(state => {

        stateSelect.innerHTML += `
            <option value="${state}">
                ${state}
            </option>
        `;

    });
}


/* =========================================================
   LOAD DRIVER BUS OPTIONS
   ========================================================= */

function loadDriverBusOptions() {

    const busSelect =
        document.getElementById("driverBusNumber");

    if (!busSelect) return;

    const buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let visibleBuses = buses;

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "").trim().toLowerCase() === "manager"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        visibleBuses =
            buses.filter(bus =>
                String(bus.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );
    }

    busSelect.innerHTML = `
    <option value="">
        Select Bus
    </option>
`;

    visibleBuses.forEach(bus => {

        const busValue =
            `${bus.busNumber}-${bus.busType}`;

        busSelect.innerHTML += `
            <option value="${busValue}">
                ${bus.busNumber} - ${bus.busType}
            </option>
        `;

    });
}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const staffForm =
        document.getElementById("staffForm");

    const driverForm =
        document.getElementById("driverForm");


    /* -----------------------------------------------------
       TERMINAL STAFF
       ----------------------------------------------------- */

    if (staffForm) {

        loadStaffStates();
        loadStaff();

        const currentUser =
            JSON.parse(localStorage.getItem("currentUser"));

        const staffRole =
            document.getElementById("staffRole");

        if (
            currentUser &&
            currentUser.role === "staff" &&
            String(currentUser.jobPosition || "")
                .trim()
                .toLowerCase() === "manager" &&
            staffRole
        ) {
            const managerOption =
                [...staffRole.options].find(option =>
                    option.value.trim().toLowerCase() === "manager"
                );

            if (managerOption) {
                managerOption.style.display = "none";
            }
        }


        const searchStaff =
            document.getElementById("searchStaff");

        if (searchStaff) {

            searchStaff.addEventListener(
                "input",
                loadStaff
            );

        }


        staffForm.addEventListener(
            "submit",
            saveStaff
        );

    }


    /* -----------------------------------------------------
       DRIVERS
       ----------------------------------------------------- */

    if (driverForm) {

        loadDriverBusOptions();
        loadDrivers();


        const searchDriver =
            document.getElementById("searchDriver");

        if (searchDriver) {

            searchDriver.addEventListener(
                "input",
                loadDrivers
            );

        }


        driverForm.addEventListener(
            "submit",
            saveDriver
        );

    }

});


/* =========================================================
   SAVE TERMINAL STAFF
   ========================================================= */

function saveStaff(event) {

    event.preventDefault();

    let staffs =
        JSON.parse(localStorage.getItem("staffs")) || [];

    let users =
        JSON.parse(localStorage.getItem("users")) || [];


    /* -----------------------------------------------------
       STAFF FORM VALUES
       ----------------------------------------------------- */

    const staffName =
        document.getElementById("staffName").value.trim();

    const role =
        document.getElementById("staffRole").value;

    const gender =
        document.getElementById("staffGender").value;

    const state =
        document.getElementById("staffState").value;

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "")
            .trim()
            .toLowerCase() === "manager" &&
        String(role || "")
            .trim()
            .toLowerCase() === "manager"
    ) {
        alert("Access Denied! Managers cannot create another Manager.");
        return;
    }

    let staffState = state;

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "").trim().toLowerCase() === "manager"
    ) {
        staffState = currentUser.state;
    }

    const phone =
        document.getElementById("staffPhone").value.trim();

    const staffUsername =
        document.getElementById("staffUsername").value.trim();

    const staffPassword =
        document.getElementById("staffPassword").value;

    const staffConfirmPassword =
        document.getElementById("staffConfirmPassword").value;


    /* -----------------------------------------------------
       VALIDATION
       ----------------------------------------------------- */

    if (
        !staffName ||
        !role ||
        !gender ||
        !state ||
        !phone ||
        !staffUsername ||
        !staffPassword ||
        !staffConfirmPassword
    ) {

        alert(
            "Please fill in all terminal staff fields."
        );

        return;

    }


    /* -----------------------------------------------------
       PASSWORD VALIDATION
       ----------------------------------------------------- */

    if (staffPassword.length < 6) {

        alert(
            "Staff password must be at least six (6) characters long."
        );

        return;

    }


    if (staffPassword !== staffConfirmPassword) {

        alert(
            "Staff passwords do not match."
        );

        return;

    }


    /* -----------------------------------------------------
       USERNAME VALIDATION
       ----------------------------------------------------- */

    const usernameExists =
        users.some(
            user =>
                user.username &&
                user.username.toLowerCase() ===
                staffUsername.toLowerCase()
        );


    if (
        usernameExists &&
        staffEditIndex === -1
    ) {

        alert(
            "This username is already in use. Please choose another username."
        );

        return;

    }


    /* -----------------------------------------------------
       STAFF ID
       ----------------------------------------------------- */

    const staffId =
        staffEditIndex === -1

            ? "ST" +
            String(staffs.length + 1)
                .padStart(3, "0")

            : staffs[staffEditIndex].staffId;


    /* -----------------------------------------------------
       STAFF OBJECT
       ----------------------------------------------------- */

    const staff = {

        staffId: staffId,

        staffName: staffName,

        /*
         * Account type
         */
        role: "staff",

        /*
         * Actual job in the terminal
         */
        jobPosition: role,

        gender: gender,

        state: staffState,

        phone: phone,

        username: staffUsername,

        createdAt:
            staffEditIndex === -1
                ? new Date().toLocaleString()
                : (
                    staffs[staffEditIndex].createdAt ||
                    new Date().toLocaleString()
                )

    };


    /* -----------------------------------------------------
       ADD NEW STAFF
       ----------------------------------------------------- */

    if (staffEditIndex === -1) {

        staffs.push(staff);


        /*
         * Create corresponding login account
         */

        const staffUser = {

            fullName: staffName,

            username: staffUsername,

            password: staffPassword,

            role: "staff",

            jobPosition: role,

            state: staffState,

            createdAt:
                new Date().toLocaleString()

        };


        users.push(staffUser);


    } else {


        /* -------------------------------------------------
           UPDATE EXISTING STAFF
           ------------------------------------------------- */

        const oldStaff =
            staffs[staffEditIndex];


        const oldUsername =
            oldStaff.username || "";


        staffs[staffEditIndex] =
            staff;


        /*
         * Find the existing login account
         */

        const userIndex =
            users.findIndex(
                user =>
                    user.username &&
                    user.username.toLowerCase() ===
                    oldUsername.toLowerCase()
            );


        if (userIndex !== -1) {

            users[userIndex].fullName =
                staffName;

            users[userIndex].username =
                staffUsername;

            users[userIndex].password =
                staffPassword;

            users[userIndex].role =
                "staff";

            users[userIndex].jobPosition =
                role;

            users[userIndex].state =
                state;

        } else {


            /*
             * Create login account if
             * the old staff has no account
             */

            users.push({

                fullName: staffName,

                username: staffUsername,

                password: staffPassword,

                role: "staff",

                state: state,

                createdAt:
                    new Date().toLocaleString()

            });

        }


        staffEditIndex = -1;


        document.querySelector(
            "#staffForm button"
        ).innerHTML = `
            <i class="fa-solid fa-user-plus"></i>
            Add Staff
        `;

    }


    /* -----------------------------------------------------
       SAVE STAFF & USER ACCOUNT
       ----------------------------------------------------- */

    localStorage.setItem(
        "staffs",
        JSON.stringify(staffs)
    );


    localStorage.setItem(
        "users",
        JSON.stringify(users)
    );


    /* -----------------------------------------------------
       NOTIFICATION
       ----------------------------------------------------- */

    if (
        typeof loadNotifyMessage ===
        "function"
    ) {

        loadNotifyMessage(
            "staff",
            {
                staffName:
                    staff.staffName
            }
        );

    }


    /* -----------------------------------------------------
       REFRESH DASHBOARD
       ----------------------------------------------------- */

    if (
        typeof refreshDashboard ===
        "function"
    ) {

        refreshDashboard();

    }


    /* -----------------------------------------------------
       RESET FORM
       ----------------------------------------------------- */

    document
        .getElementById("staffForm")
        .reset();


    /* -----------------------------------------------------
       REFRESH STAFF DIRECTORY
       ----------------------------------------------------- */

    loadStaff();

}


function loadStaff() {

    const tableBody =
        document.getElementById(
            "staffTableBody"
        );

    if (!tableBody) return;


    tableBody.innerHTML = "";


    const staffs =
        JSON.parse(
            localStorage.getItem("staffs")
        ) || [];


    const drivers =
        JSON.parse(
            localStorage.getItem("drivers")
        ) || [];

    const buses =
        JSON.parse(
            localStorage.getItem("buses")
        ) || [];


    /*
     * Only terminal staff belong in the
     * Terminal Staff Directory.
     *
     * This also protects the directory if
     * an old Driver record still exists
     * inside the staffs collection.
     */

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let terminalStaff =
        staffs.filter(
            staff => staff.role !== "Driver"
        );

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "").trim().toLowerCase() === "manager"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        terminalStaff =
            terminalStaff.filter(staff =>
                String(staff.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );
    }


    /*
     * ==============================
     * STAFF OVERVIEW COUNTS
     * ==============================
     */

    const totalTerminalStaff =
        document.getElementById(
            "totalTerminalStaff"
        );


    const totalDrivers =
        document.getElementById(
            "totalDrivers"
        );


    const totalStaff =
        document.getElementById(
            "totalStaff"
        );


    /*
     * Terminal Staff Count
     */

    if (totalTerminalStaff) {

        totalTerminalStaff.textContent =
            terminalStaff.length;

    }


    /*
     * Driver Count
     */

    let visibleDrivers = drivers;

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "")
            .trim()
            .toLowerCase() === "manager"
    ) {

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        const visibleBusNumbers =
            buses
                .filter(bus =>
                    String(bus.state || "")
                        .trim()
                        .toLowerCase() === assignedState
                )
                .map(bus =>
                    `${bus.busNumber}-${bus.busType}`
                );

        visibleDrivers =
            drivers.filter(driver =>
                visibleBusNumbers.includes(
                    driver.busNumber
                )
            );
    }


    if (totalDrivers) {

        totalDrivers.textContent =
            visibleDrivers.length;

    }


    /*
     * Total Staff =
     * Terminal Staff + Drivers
     */

    if (totalStaff) {

        totalStaff.textContent =
            terminalStaff.length +
            visibleDrivers.length;

    }


    /*
     * ==============================
     * TERMINAL STAFF DIRECTORY
     * ==============================
     */

    if (terminalStaff.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9"
                    style="text-align:center;">
                    No terminal staff available
                </td>
            </tr>
        `;

        return;

    }


    const searchValue =
        document.getElementById(
            "searchStaff"
        )?.value
            .toLowerCase()
            .trim() || "";


    terminalStaff.forEach((staff) => {

        const matchesSearch = [

            staff.staffId,

            staff.staffName,

            staff.role,

            staff.jobPosition,

            staff.gender,

            staff.state,

            staff.phone

        ]
            .join(" ")
            .toLowerCase()
            .includes(searchValue);


        if (!matchesSearch) return;


        /*
         * Find the original index in localStorage.
         * This keeps Edit/Delete working correctly
         * even when search is being used.
         */

        const originalIndex =
            staffs.indexOf(staff);


        tableBody.innerHTML += `
            <tr>

                <td>
                    ${staff.staffId}
                </td>

                <td>
                    ${staff.staffName}
                </td>

                <td>
                    ${staff.role || "staff"}
                </td>

                 <td>
                    ${staff.jobPosition || "N/A"}
                </td>

                <td>
                    ${staff.gender}
                </td>

                <td>
                    ${staff.state || "N/A"}
                </td>

                <td>
                    ${staff.phone}
                </td>

                <td>
                    ${staff.createdAt || "N/A"}
                </td>

                <td>

                    <button
                        onclick="editStaff(${originalIndex})"
                        class="edit-btn">
                        Edit
                    </button>

                    <button
                        onclick="deleteStaff(${originalIndex})"
                        class="delete-btn">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    });


    /*
     * If search produced no result
     */

    if (!tableBody.innerHTML.trim()) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9"
                    style="text-align:center;">
                    No matching terminal staff found
                </td>
            </tr>
        `;

    }

}

/* =========================================================
   EDIT TERMINAL STAFF
   ========================================================= */

function editStaff(index) {

    const staffs =
        JSON.parse(
            localStorage.getItem("staffs")
        ) || [];


    const staff =
        staffs[index];

    if (!staff) return;

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "").trim().toLowerCase() === "manager"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        const staffState =
            String(staff.state || "")
                .trim()
                .toLowerCase();

        if (staffState !== assignedState) {
            alert("You can only edit staff in your assigned state.");
            return;
        }
    }


    document.getElementById(
        "staffName"
    ).value =
        staff.staffName || "";


    document.getElementById(
        "staffRole"
    ).value =
        staff.jobPosition || "";


    document.getElementById(
        "staffGender"
    ).value =
        staff.gender || "";


    document.getElementById(
        "staffState"
    ).value =
        staff.state || "";


    document.getElementById(
        "staffPhone"
    ).value =
        staff.phone || "";


    staffEditIndex =
        index;


    document.querySelector(
        "#staffForm button"
    ).innerHTML = `
        <i class="fa-solid fa-pen"></i>
        Update Staff
    `;

}


/* =========================================================
   DELETE TERMINAL STAFF
   ========================================================= */

function deleteStaff(index) {

    if (
        !confirm(
            "Are you sure you want to delete this staff?"
        )
    ) {

        return;

    }


    let staffs =
        JSON.parse(
            localStorage.getItem("staffs")
        ) || [];


    const staff =
        staffs[index];

    if (!staff) return;

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "").trim().toLowerCase() === "manager"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        const staffState =
            String(staff.state || "")
                .trim()
                .toLowerCase();

        if (staffState !== assignedState) {
            alert("You can only delete staff in your assigned state.");
            return;
        }
    }


    staffs.splice(index, 1);


    localStorage.setItem(
        "staffs",
        JSON.stringify(staffs)
    );


    if (
        typeof loadNotifyMessage ===
        "function"
    ) {

        loadNotifyMessage(
            "staffDeleted",
            {
                staffName:
                    staff.staffName || "Staff"
            }
        );

    }


    if (
        typeof refreshDashboard ===
        "function"
    ) {

        refreshDashboard();

    }


    loadStaff();

}


/* =========================================================
   SAVE DRIVER
   ========================================================= */

function saveDriver(event) {

    event.preventDefault();

    let drivers =
        JSON.parse(
            localStorage.getItem("drivers")
        ) || [];


    const driverName =
        document.getElementById(
            "driverName"
        ).value.trim();


    const gender =
        document.getElementById(
            "driverGender"
        ).value;


    const busNumber =
        document.getElementById(
            "driverBusNumber"
        ).value;

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "").trim().toLowerCase() === "manager"
    ) {
        const buses =
            JSON.parse(localStorage.getItem("buses")) || [];

        const selectedBus =
            buses.find(bus =>
                `${bus.busNumber}-${bus.busType}` === busNumber
            );

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        const busState =
            String(selectedBus?.state || "")
                .trim()
                .toLowerCase();

        if (!selectedBus || busState !== assignedState) {
            alert("You can only assign drivers to buses in your assigned state.");
            return;
        }
    }


    const phone =
        document.getElementById(
            "driverPhone"
        ).value.trim();


    /* -----------------------------------------------------
       VALIDATION
       ----------------------------------------------------- */

    if (
        !driverName ||
        !gender ||
        !busNumber ||
        !phone
    ) {

        alert(
            "Please fill in all driver fields."
        );

        return;

    }


    /* -----------------------------------------------------
       ONE DRIVER PER BUS
       ----------------------------------------------------- */

    const busAlreadyAssigned =
        drivers.find(
            (driver, index) =>

                driver.busNumber ===
                busNumber &&

                index !== driverEditIndex
        );


    if (busAlreadyAssigned) {

        alert(
            "This bus has already been assigned to another driver."
        );

        return;

    }


    /* -----------------------------------------------------
       DRIVER ID
       ----------------------------------------------------- */

    const driverId =
        driverEditIndex === -1

            ? "DR" +
            String(drivers.length + 1)
                .padStart(3, "0")

            : drivers[driverEditIndex].driverId;


    /* -----------------------------------------------------
       DRIVER OBJECT
       ----------------------------------------------------- */

    const driver = {

        driverId: driverId,

        driverName: driverName,

        gender: gender,

        busNumber: busNumber,

        phone: phone,

        createdAt:
            driverEditIndex === -1
                ? new Date().toLocaleString()
                : (
                    drivers[driverEditIndex].createdAt ||
                    new Date().toLocaleString()
                )

    };


    /* -----------------------------------------------------
       ADD / UPDATE
       ----------------------------------------------------- */

    if (driverEditIndex === -1) {

        drivers.push(driver);

    } else {

        drivers[driverEditIndex] =
            driver;

        driverEditIndex = -1;

        document.querySelector(
            "#driverForm button"
        ).innerHTML = `
            <i class="fa-solid fa-user-plus"></i>
            Add Driver
        `;

    }


    /* -----------------------------------------------------
       SAVE
       ----------------------------------------------------- */

    localStorage.setItem(
        "drivers",
        JSON.stringify(drivers)
    );


    if (
        typeof loadNotifyMessage ===
        "function"
    ) {

        loadNotifyMessage(
            "driver",
            {
                driverName:
                    driver.driverName
            }
        );

    }


    if (
        typeof refreshDashboard ===
        "function"
    ) {

        refreshDashboard();

    }


    document
        .getElementById("driverForm")
        .reset();


    loadDriverBusOptions();
    loadDrivers();
    loadStaff();


}


/* =========================================================
   LOAD DRIVERS
   ========================================================= */

function loadDrivers() {

    const tableBody =
        document.getElementById(
            "driverTableBody"
        );

    if (!tableBody) return;


    tableBody.innerHTML = "";


    const drivers =
        JSON.parse(localStorage.getItem("drivers")) || [];

    const buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    let visibleDrivers = drivers;

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "").trim().toLowerCase() === "manager"
    ) {
        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        const visibleBusNumbers =
            buses
                .filter(bus =>
                    String(bus.state || "")
                        .trim()
                        .toLowerCase() === assignedState
                )
                .map(bus =>
                    `${bus.busNumber}-${bus.busType}`
                );

        visibleDrivers =
            drivers.filter(driver =>
                visibleBusNumbers.includes(driver.busNumber)
            );
    }


    const searchValue =
        document.getElementById(
            "searchDriver"
        )?.value
            .toLowerCase()
            .trim() || "";


    if (drivers.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center;">
                    No drivers available
                </td>
            </tr>
        `;

        return;

    }


    visibleDrivers.forEach((driver, index) => {

        const searchText = [

            driver.driverId,

            driver.driverName,

            driver.gender,

            driver.busNumber,

            driver.phone

        ]
            .join(" ")
            .toLowerCase();


        if (
            !searchText.includes(
                searchValue
            )
        ) {

            return;

        }

        const originalIndex =
            drivers.indexOf(driver);


        tableBody.innerHTML += `
            <tr>

                <td>
                    ${driver.driverId}
                </td>

                <td>
                    ${driver.driverName}
                </td>

                <td>
                    ${driver.gender}
                </td>

                <td>
                    ${driver.busNumber}
                </td>

                <td>
                    ${driver.phone}
                </td>

                <td>
                    ${driver.createdAt || "N/A"}
                </td>

                <td>

                    <button
                        onclick="editDriver(${originalIndex})"
                        class="edit-btn">
                        Edit
                    </button>

                    <button
                        onclick="deleteDriver(${originalIndex})"
                        class="delete-btn">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    });


    if (!tableBody.innerHTML.trim()) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center;">
                    No matching drivers found
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   EDIT DRIVER
   ========================================================= */

function editDriver(index) {

    const drivers =
        JSON.parse(
            localStorage.getItem("drivers")
        ) || [];


    const driver =
        drivers[index];

    if (!driver) return;

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "").trim().toLowerCase() === "manager"
    ) {
        const buses =
            JSON.parse(localStorage.getItem("buses")) || [];

        const assignedBus =
            buses.find(bus =>
                `${bus.busNumber}-${bus.busType}` === driver.busNumber
            );

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        const busState =
            String(assignedBus?.state || "")
                .trim()
                .toLowerCase();

        if (!assignedBus || busState !== assignedState) {
            alert("You can only edit drivers assigned to buses in your state.");
            return;
        }
    }


    document.getElementById(
        "driverName"
    ).value =
        driver.driverName || "";


    document.getElementById(
        "driverGender"
    ).value =
        driver.gender || "";


    loadDriverBusOptions();


    document.getElementById(
        "driverBusNumber"
    ).value =
        driver.busNumber || "";


    document.getElementById(
        "driverPhone"
    ).value =
        driver.phone || "";


    driverEditIndex =
        index;


    document.querySelector(
        "#driverForm button"
    ).innerHTML = `
        <i class="fa-solid fa-pen"></i>
        Update Driver
    `;

}


/* =========================================================
   DELETE DRIVER
   ========================================================= */

function deleteDriver(index) {

    if (!confirm("Are you sure you want to delete this driver?")) {
        return;
    }

    let drivers =
        JSON.parse(localStorage.getItem("drivers")) || [];

    const driver =
        drivers[index];

    if (!driver) return;

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (
        currentUser &&
        currentUser.role === "staff" &&
        String(currentUser.jobPosition || "").trim().toLowerCase() === "manager"
    ) {

        const buses =
            JSON.parse(localStorage.getItem("buses")) || [];

        const assignedBus =
            buses.find(bus =>
                `${bus.busNumber}-${bus.busType}` === driver.busNumber
            );

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        const busState =
            String(assignedBus?.state || "")
                .trim()
                .toLowerCase();

        if (!assignedBus || busState !== assignedState) {
            alert(
                "You can only delete drivers assigned to buses in your state."
            );
            return;
        }
    }

    drivers.splice(index, 1);

    localStorage.setItem(
        "drivers",
        JSON.stringify(drivers)
    );

    if (typeof loadNotifyMessage === "function") {
        loadNotifyMessage("driverDeleted", {
            driverName: driver.driverName || "Driver"
        });
    }

    if (typeof refreshDashboard === "function") {
        refreshDashboard();
    }

    loadDrivers();
    loadStaff();
}




//=============================
//Report Section
//===========================

document.addEventListener("DOMContentLoaded", () => {

    const reportPage =
        document.getElementById("reportBuses");

    if (!reportPage) return;

    removeExpiredBookings();

    refreshDashboard();

    loadReports();

});

function loadReports() {
    removeExpiredBookings();

    if (!document.getElementById("reportBuses")) {
        return;
    }

    let buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    let routes =
        JSON.parse(localStorage.getItem("routes")) || [];

    let schedules =
        JSON.parse(localStorage.getItem("schedules")) || [];

    let bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    let staffs =
        JSON.parse(localStorage.getItem("staffs")) || [];

    let drivers =
        JSON.parse(localStorage.getItem("drivers")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));


    /*
     * ==========================================
     * DEFAULT
     * ADMIN SEES EVERYTHING
     * ==========================================
     */

    let visibleBuses = buses;
    let visibleRoutes = routes;
    let visibleSchedules = schedules;
    let visibleBookings = bookings;
    let visibleStaffs =
        staffs.filter(
            staff => staff.role !== "Driver"
        );

    let visibleDrivers = drivers;


    /*
     * ==========================================
     * STAFF STATE RESTRICTION
     * ==========================================
     */

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();


        visibleBuses =
            buses.filter(bus =>
                String(bus.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );


        visibleRoutes =
            routes.filter(route =>
                String(route.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );


        visibleSchedules =
            schedules.filter(schedule =>
                String(schedule.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );


        visibleStaffs =
            staffs.filter(staff =>
                staff.role !== "Driver" &&
                String(staff.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );


        visibleDrivers =
            drivers.filter(driver => {

                const driverBus =
                    String(driver.assignedBus || "")
                        .replace(/\s+/g, "")
                        .toLowerCase();

                return visibleBuses.some(bus =>
                    `${bus.busNumber}-${bus.busType}`
                        .replace(/\s+/g, "")
                        .toLowerCase() === driverBus
                );
            });


        visibleBookings =
            bookings.filter(booking => {

                const bookingBus =
                    String(
                        booking.selectedBus ||
                        booking.busNumber ||
                        ""
                    )
                        .replace(/\s+/g, "")
                        .toLowerCase();

                return visibleBuses.some(bus =>
                    `${bus.busNumber}-${bus.busType}`
                        .replace(/\s+/g, "")
                        .toLowerCase() === bookingBus
                );
            });
    }


    /*
     * ==========================================
     * SCHEDULE STATUS
     * ==========================================
     */

    const scheduled =
        visibleSchedules.filter(
            schedule => schedule.status === "Scheduled"
        ).length;

    const boarding =
        visibleSchedules.filter(
            schedule => schedule.status === "Boarding"
        ).length;

    const delayed =
        visibleSchedules.filter(
            schedule => schedule.status === "Delayed"
        ).length;

    const departed =
        visibleSchedules.filter(
            schedule => schedule.status === "Departed"
        ).length;

    const cancelled =
        visibleSchedules.filter(
            schedule => schedule.status === "Cancelled"
        ).length;


    /*
     * ==========================================
     * BOOKING STATUS
     * ==========================================
     */

    const paidBookings =
        visibleBookings.filter(
            booking =>
                booking.paymentStatus === "Paid" &&
                booking.bookingStatus !== "Cancelled"
        ).length;

    const pendingBookings =
        visibleBookings.filter(
            booking =>
                booking.paymentStatus === "Pending" &&
                booking.bookingStatus === "Active"
        ).length;

    const cancelledBookings =
        visibleBookings.filter(
            booking =>
                booking.bookingStatus === "Cancelled"
        ).length;

    const expiredBookings =
        visibleBookings.filter(
            booking =>
                booking.bookingStatus === "Expired"
        ).length;


    /*
     * ==========================================
     * ACTIVE RECORDS
     * ==========================================
     */

    const activeBookings =
        visibleBookings.filter(
            booking =>
                booking.bookingStatus !== "Cancelled" &&
                booking.bookingStatus !== "Expired"
        );

    const activeSchedules =
        visibleSchedules.filter(
            schedule =>
                schedule.status !== "Cancelled" &&
                schedule.status !== "Departed"
        );


    /*
     * ==========================================
     * STAFF BREAKDOWN
     * ==========================================
     */

    const cashier =
        visibleStaffs.filter(staff =>
            String(staff.jobPosition || "")
                .trim()
                .toLowerCase() === "cashier"
        ).length;

    const terminalOfficers =
        visibleStaffs.filter(staff =>
            String(staff.jobPosition || "")
                .trim()
                .toLowerCase() === "terminal officer"
        ).length;

    const managers =
        visibleStaffs.filter(staff =>
            String(staff.jobPosition || "")
                .trim()
                .toLowerCase() === "manager"
        ).length;

    const security =
        visibleStaffs.filter(staff =>
            String(staff.jobPosition || "")
                .trim()
                .toLowerCase() === "security"
        ).length;

    const allStaff = [
        ...visibleStaffs,
        ...visibleDrivers
    ];

    const maleStaff =
        allStaff.filter(staff =>
            String(staff.gender || "")
                .trim()
                .toLowerCase() === "male"
        ).length;

    const femaleStaff =
        allStaff.filter(staff =>
            String(staff.gender || "")
                .trim()
                .toLowerCase() === "female"
        ).length;


    /*
     * ==========================================
     * REVENUE
     * ==========================================
     */

    let totalRevenue = 0;

    visibleBookings.forEach(booking => {

        if (
            booking.paymentStatus === "Paid" &&
            booking.bookingStatus !== "Cancelled"
        ) {

            const amount =
                Number(
                    String(
                        booking.ticketPrice ||
                        booking.fare ||
                        booking.amount ||
                        0
                    ).replace(/[₦,]/g, "")
                ) || 0;

            totalRevenue += amount;
        }
    });


    /*
     * ==========================================
     * PASSENGERS
     * ==========================================
     */

    const totalPassengers =
        visibleBookings.filter(
            booking =>
                booking.bookingStatus === "Active"
        ).length;


    /*
     * ==========================================
     * REPORT CARDS
     * ==========================================
     */

    document.getElementById("reportBuses").textContent =
        visibleBuses.length;

    document.getElementById("reportRoutes").textContent =
        visibleRoutes.length;

    document.getElementById("reportSchedules").textContent =
        activeSchedules.length;

    document.getElementById("reportBookings").textContent =
        activeBookings.length;

    document.getElementById("reportStaff").textContent =
        visibleStaffs.length + visibleDrivers.length;

    document.getElementById("reportRevenue").textContent =
        "₦" + totalRevenue.toLocaleString();

    document.getElementById("reportPaid").textContent =
        paidBookings;

    document.getElementById("reportPending").textContent =
        pendingBookings;

    document.getElementById("reportCancelledBooking").textContent =
        cancelledBookings;

    document.getElementById("reportDrivers").textContent =
        visibleDrivers.length;

    document.getElementById("reportCashier").textContent =
        cashier;

    document.getElementById("reportTerminal").textContent =
        terminalOfficers;

    document.getElementById("reportManagers").textContent =
        managers;

    document.getElementById("reportSecurity").textContent =
        security;

    document.getElementById("reportMale").textContent =
        maleStaff;

    document.getElementById("reportFemale").textContent =
        femaleStaff;

    document.getElementById("reportScheduled").textContent =
        scheduled;

    document.getElementById("reportBoarding").textContent =
        boarding;

    document.getElementById("reportDelayed").textContent =
        delayed;

    document.getElementById("reportDeparted").textContent =
        departed;

    document.getElementById("reportCancelled").textContent =
        cancelled;


    /*
     * ==========================================
     * SYSTEM SUMMARY
     * ==========================================
     */

    document.getElementById("busSummary").textContent =
        visibleBuses.length;

    document.getElementById("routeSummary").textContent =
        visibleRoutes.length;

    document.getElementById("scheduleSummary").textContent =
        activeSchedules.length;

    document.getElementById("boardingScheduleSummary").textContent =
        boarding;

    document.getElementById("delayedScheduleSummary").textContent =
        delayed;

    document.getElementById("departedScheduleSummary").textContent =
        departed;

    document.getElementById("cancelledScheduleSummary").textContent =
        cancelled;

    document.getElementById("bookingSummary").textContent =
        activeBookings.length;

    document.getElementById("bookingPaidSummary").textContent =
        paidBookings;

    document.getElementById("bookingPendingSummary").textContent =
        pendingBookings;

    document.getElementById("cancelledBookingSummary").textContent =
        cancelledBookings;

    document.getElementById("expiredBookingSummary").textContent =
        expiredBookings;

    document.getElementById("passengerSummary").textContent =
        totalPassengers;

    document.getElementById("staffSummary").textContent =
        visibleStaffs.length + visibleDrivers.length;
}

// document.addEventListener("DOMContentLoaded", () => {

//     const reportPage = document.getElementById("reportBuses");

//     if (!reportPage) return;


//     removeExpiredBookings();
//     refreshDashboard();
//     loadReports();

// });

// function loadReports() {
//     removeExpiredBookings();

//     if (!document.getElementById("reportBuses")) {
//         return;
//     }

//     const buses = JSON.parse(localStorage.getItem("buses")) || [];
//     const routes = JSON.parse(localStorage.getItem("routes")) || [];

//     const schedules = JSON.parse(localStorage.getItem("schedules")) || [];
//     const scheduled = schedules.filter(schedule =>
//         schedule.status === "Scheduled"
//     ).length;
//     const boarding = schedules.filter(schedule =>
//         schedule.status === "Boarding"
//     ).length;
//     const delayed = schedules.filter(schedule =>
//         schedule.status === "Delayed"
//     ).length;
//     const departed = schedules.filter(schedule =>
//         schedule.status === "Departed"
//     ).length;
//     const cancelled = schedules.filter(schedule =>
//         schedule.status === "Cancelled"
//     ).length;


//     const bookings = JSON.parse(localStorage.getItem("bookings")) || [];

//     const totalRevenue = JSON.parse(localStorage.getItem("totalRevenue")) || [];

//     const paidBookings = bookings.filter(
//         booking => booking.paymentStatus === "Paid" &&
//             booking.bookingStatus !== "Cancelled"
//     ).length;

//     const pendingBookings = bookings.filter(
//         booking => booking.paymentStatus === "Pending" &&
//             booking.bookingStatus === "Active"
//     ).length;

//     const cancelledBookings = bookings.filter(booking =>
//         booking.bookingStatus === "Cancelled"
//     ).length;


//     const staffs = JSON.parse(localStorage.getItem("staffs")) || [];
//     const drivers = staffs.filter(staff =>
//         staff.role === "Driver"
//     ).length;
//     const conductors = staffs.filter(staff =>
//         staff.role === "Conductor"
//     ).length;
//     const cashier = staffs.filter(staff =>
//         staff.role === "Cashier"
//     ).length;
//     const terminalOfficers = staffs.filter(staff =>
//         staff.role === "Terminal"
//     ).length;
//     const managers = staffs.filter(staff =>
//         staff.role === "Manager"
//     ).length;
//     const security = staffs.filter(staff =>
//         staff.role === "Security"
//     ).length;
//     const maleStaff = staffs.filter(staff =>
//         staff.gender === "Male"
//     ).length;
//     const femaleStaff = staffs.filter(staff =>
//         staff.gender === "Female"
//     ).length;

//     const activeBookings = bookings.filter(booking =>
//         booking.bookingStatus !== "Cancelled" &&
//         booking.bookingStatus !== "Expired"
//     );

//     const activeSchedules = schedules.filter(
//         schedule => schedule.status !== "Cancelled" &&
//             schedule.status !== "Departed"
//     );

//     document.getElementById("reportBuses").textContent = buses.length;
//     document.getElementById("reportRoutes").textContent = routes.length;
//     document.getElementById("reportSchedules").textContent = activeSchedules.length;
//     document.getElementById("reportBookings").textContent = activeBookings.length;
//     document.getElementById("reportStaff").textContent = staffs.length;
//     document.getElementById("reportRevenue").textContent = "\u20A6" + totalRevenue.toLocaleString();
//     document.getElementById("reportPaid").textContent = paidBookings;
//     document.getElementById("reportPending").textContent = pendingBookings;
//     document.getElementById("reportCancelledBooking").textContent = cancelledBookings;
//     document.getElementById("reportDrivers").textContent = drivers;
//     document.getElementById("reportConductors").textContent = conductors;
//     document.getElementById("reportCashier").textContent = cashier;
//     document.getElementById("reportTerminal").textContent = terminalOfficers;
//     document.getElementById("reportManagers").textContent = managers;
//     document.getElementById("reportSecurity").textContent = security;
//     document.getElementById("reportMale").textContent = maleStaff;
//     document.getElementById("reportFemale").textContent = femaleStaff;
//     document.getElementById("reportScheduled").textContent = scheduled;
//     document.getElementById("reportBoarding").textContent = boarding;
//     document.getElementById("reportDelayed").textContent = delayed;
//     document.getElementById("reportDeparted").textContent = departed;
//     document.getElementById("reportCancelled").textContent = cancelled;
//     // SYSTEM SUMMARY

//     const expiredBookings = bookings.filter(
//         booking => booking.bookingStatus === "Expired"
//     ).length;


//     const totalPassengers = bookings.filter(
//         booking => booking.bookingStatus === "Active"
//     ).length;




//     document.getElementById("busSummary").textContent = buses.length;

//     document.getElementById("routeSummary").textContent = routes.length;

//     document.getElementById("scheduleSummary").textContent = activeSchedules.length;

//     //document.getElementById("currentScheduleSummary").textContent = scheduled;

//     document.getElementById("boardingScheduleSummary").textContent = boarding;

//     document.getElementById("delayedScheduleSummary").textContent = delayed;

//     document.getElementById("departedScheduleSummary").textContent = departed;

//     document.getElementById("cancelledScheduleSummary").textContent = cancelled;

//     document.getElementById("bookingSummary").textContent = activeBookings.length;

//     document.getElementById("bookingPaidSummary").textContent = paidBookings;

//     document.getElementById("bookingPendingSummary").textContent = pendingBookings;

//     document.getElementById("cancelledBookingSummary").textContent = cancelledBookings;

//     document.getElementById("expiredBookingSummary").textContent = expiredBookings;

//     document.getElementById("passengerSummary").textContent = totalPassengers;

//     document.getElementById("staffSummary").textContent = staffs.length;



// }



//==================
//Logout Section
//===============
function logout() {

    if (confirm("Are you sure you want to logout?")) {
        loadNotifyMessage("logout", { username: currentUser.username });

        window.location.href = "login.html";
    }
}

//============================
//Dashboard Section
//========================
document.addEventListener("DOMContentLoaded", () => {
    const dashboard = document.getElementById("totalBuses");

    if (!dashboard) return;

    loadDashboardStats();
    loadRecentActivities();
    calculateRevenue();
    loadTodayDepartures();
    loadUpcomingDepartures();
    loadScheduleStatusChart();
    loadBookingStatusChart();
    loadRevenueTrendChart();
    loadBusStatisticsChart();
    loadTopRoutesChart();
    loadGenderChart();
    loadTopRoutes();
    displayLoggedInUser();
    updateDashboardTime();
    loadDashboardInsights();
    loadNotifications();
});

function loadDashboardStats() {

    removeExpiredBookings();

    let buses =
        JSON.parse(localStorage.getItem("buses")) || [];

    let routes =
        JSON.parse(localStorage.getItem("routes")) || [];

    let schedules =
        JSON.parse(localStorage.getItem("schedules")) || [];

    let bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    let staffs =
        JSON.parse(localStorage.getItem("staffs")) || [];

    let drivers =
        JSON.parse(localStorage.getItem("drivers")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    const totalBuses =
        document.getElementById("totalBuses");

    const totalRoutes =
        document.getElementById("totalRoutes");

    const totalSchedules =
        document.getElementById("totalSchedules");

    const totalBookings =
        document.getElementById("totalBookings");


    /*
     * FILTER RECORDS BY STAFF STATE
     */

    let visibleBuses = buses;
    let visibleRoutes = routes;
    let visibleSchedules = schedules;
    let visibleStaffs =
        staffs.filter(
            staff => staff.role !== "Driver"
        );
    let visibleDrivers = drivers;

    if (
        currentUser &&
        currentUser.role === "staff"
    ) {

        const assignedState =
            String(currentUser.state || "")
                .trim()
                .toLowerCase();

        visibleBuses =
            buses.filter(bus =>
                String(bus.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );

        visibleRoutes =
            routes.filter(route =>
                String(route.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );

        visibleSchedules =
            schedules.filter(schedule =>
                String(schedule.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );

        visibleStaffs =
            staffs.filter(staff =>
                staff.role !== "Driver" &&
                String(staff.state || "")
                    .trim()
                    .toLowerCase() === assignedState
            );

        visibleDrivers =
            drivers.filter(driver => {

                const driverBus =
                    String(driver.busNumber || "")
                        .replace(/\s+/g, "")
                        .toLowerCase();

                return visibleBuses.some(bus =>
                    `${bus.busNumber}-${bus.busType}`
                        .replace(/\s+/g, "")
                        .toLowerCase() === driverBus
                );
            });
    }


    /*
     * ACTIVE BOOKINGS
     */

    const activeBookings =
        bookings.filter(
            booking =>
                booking.bookingStatus !== "Cancelled" &&
                booking.bookingStatus !== "Expired"
        );


    /*
     * ACTIVE SCHEDULES
     */

    const activeSchedules =
        visibleSchedules.filter(
            schedule =>
                schedule.status !== "Cancelled" &&
                schedule.status !== "Departed"
        );


    /*
     * UPDATE DASHBOARD CARDS
     */

    if (totalBuses) {
        totalBuses.textContent =
            visibleBuses.length;
    }

    if (totalRoutes) {
        totalRoutes.textContent =
            visibleRoutes.length;
    }

    if (totalSchedules) {
        totalSchedules.textContent =
            activeSchedules.length;
    }

    if (totalBookings) {
        totalBookings.textContent =
            activeBookings.length;
    }

    const totalStaff =
        document.getElementById("totalStaff");

    const totalDrivers =
        document.getElementById("totalDrivers");

    const totalTerminalStaff =
        document.getElementById("totalTerminalStaff");

    if (totalStaff) {
        totalStaff.textContent =
            visibleStaffs.length + visibleDrivers.length;
    }

    if (totalDrivers) {
        totalDrivers.textContent =
            visibleDrivers.length;
    }

    if (totalTerminalStaff) {
        totalTerminalStaff.textContent =
            visibleStaffs.length;
    }
}
// function loadDashboardStats() {

//     removeExpiredBookings();

//     let buses = JSON.parse(localStorage.getItem("buses")) || [];
//     let routes = JSON.parse(localStorage.getItem("routes")) || [];
//     let schedules = JSON.parse(localStorage.getItem("schedules")) || [];
//     let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

//     const totalBuses = document.getElementById("totalBuses");
//     const totalRoutes = document.getElementById("totalRoutes");
//     const totalSchedules = document.getElementById("totalSchedules");
//     const totalBookings = document.getElementById("totalBookings");

//     const activeBookings = bookings.filter(
//         booking => booking.bookingStatus !== "Cancelled" &&
//             booking.bookingStatus !== "Expired"
//     );

//     const activeSchedules = schedules.filter(
//         schedule => schedule.status !== "Cancelled" &&
//             schedule.status !== "Departed"

//     );

//     if (totalBuses) totalBuses.textContent = buses.length;
//     if (totalRoutes) totalRoutes.textContent = routes.length;

//     if (totalSchedules) totalSchedules.textContent = activeSchedules.length;
//     if (totalBookings) totalBookings.textContent = activeBookings.length;



// }

function loadRecentActivities() {

    const activitiesTable = document.getElementById("recentActivities");

    if (!activitiesTable) return;

    activitiesTable.innerHTML = "";

    const buses = JSON.parse(localStorage.getItem("buses")) || [];
    const routes = JSON.parse(localStorage.getItem("routes")) || [];
    const schedules = JSON.parse(localStorage.getItem("schedules")) || [];
    const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const staffs = JSON.parse(localStorage.getItem("staffs")) || [];

    let activities = [];


    // BUS ADDED
    buses.slice(-3).forEach(bus => {
        activities.push({
            activity: `🚌 Bus Added: ${bus.busNumber} - ${bus.busType}`,
            date: bus.createdAt || new Date()
        });
    });


    // ROUTE ADDED / UPDATED
    routes.slice(-3).forEach(route => {
        activities.push({
            activity: `🛣️ Route Added: ${route.routeName}`,
            date: route.createdAt || new Date()
        });
    });


    routes
        .filter(route => route.updatedAt)
        .slice(-3)
        .forEach(route => {
            activities.push({
                activity: `✏️ Route Updated: ${route.routeName}`,
                date: route.updatedAt
            });
        });



    // SCHEDULE CREATED
    schedules.slice(-3).forEach(schedule => {
        activities.push({
            activity: `🕒 Schedule Created: ${schedule.busNumber}`,
            date: schedule.createdAt || new Date()
        });
    });


    // SCHEDULE STATUS
    schedules.forEach(schedule => {


        if (schedule.status === "Cancelled") {
            activities.push({
                activity: `❌ Schedule Cancelled: ${schedule.busNumber}`,
                date: schedule.updatedAt || schedule.createdAt
            });
        }


        if (schedule.status === "Departed") {
            activities.push({
                activity: `🔴 Schedule Departed: ${schedule.busNumber}`,
                date: schedule.updatedAt || schedule.createdAt
            });
        }


        if (schedule.status === "Delayed") {
            activities.push({
                activity: `🟡 Schedule Delayed: ${schedule.busNumber}`,
                date: schedule.updatedAt || schedule.createdAt
            });
        }


        if (schedule.status === "Boarding") {
            activities.push({
                activity: `🔵 Schedule Boarding: ${schedule.busNumber}`,
                date: schedule.updatedAt || schedule.createdAt
            });
        }

    });



    // BOOKINGS CREATED
    bookings.slice(-3).forEach(booking => {
        activities.push({
            activity: `🎫 Booking Added: ${booking.passengerName}`,
            date: booking.bookingDate || new Date()
        });
    });



    // BOOKING UPDATED
    bookings
        .filter(booking => booking.bookingStatus === "Updated")
        .slice(-3)
        .forEach(booking => {
            activities.push({
                activity: `✏️ Booking Updated: ${booking.passengerName}`,
                date: booking.updatedAt || booking.bookingDate
            });
        });



    // PAYMENTS
    bookings
        .filter(booking => booking.paymentStatus === "Paid")
        .slice(-3)
        .forEach(booking => {
            activities.push({
                activity: `💳 Payment Received: ${booking.passengerName}`,
                date: booking.paymentDate || booking.bookingDate
            });
        });



    // CANCELLED BOOKINGS
    bookings
        .filter(booking => booking.bookingStatus === "Cancelled")
        .slice(-3)
        .forEach(booking => {
            activities.push({
                activity: `❌ Booking Cancelled: ${booking.passengerName}`,
                date: booking.updatedAt || booking.bookingDate
            });
        });



    // EXPIRED BOOKINGS
    bookings
        .filter(booking => booking.bookingStatus === "Expired")
        .slice(-3)
        .forEach(booking => {
            activities.push({
                activity: `⌛ Booking Expired: ${booking.passengerName}`,
                date: booking.departureDate + " " + booking.departureTime
            });
        });



    // STAFF
    staffs.slice(-3).forEach(staff => {
        activities.push({
            activity: `💼 Staff Added: ${staff.staffName} (${staff.role})`,
            date: staff.createdAt || new Date()
        });
    });



    if (activities.length === 0) {

        activitiesTable.innerHTML = `
        <tr>
        <td colspan="2">
        No recent activities
        </td>
        </tr>`;

        return;
    }



    activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
        .forEach(item => {

            activitiesTable.innerHTML += `
        <tr>
            <td>${item.activity}</td>
            <td>${timeAgo(item.date)}</td>
        </tr>
        `;

        });

}

function loadTodayDepartures() {
    // console.log("loadTodayDepartures is running....")
    const tableBody = document.getElementById("todayDeparturesBody");
    // console.log(tableBody);

    if (!tableBody) return;
    tableBody.innerHTML = "";

    const schedules = JSON.parse(localStorage.getItem("schedules")) || [];

    const now = new Date();
    const today =
        now.getFullYear() + "-" +
        String(now.getMonth() +
            1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0");


    // console.log("Today's Date:", today);
    // console.log("schedules:", schedules);

    const todaySchedules = schedules.filter(schedule => schedule.departureDate === today);

    if (todaySchedules.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">
                    No departures today
                </td>
            </tr>
        `;
        return;
    }

    todaySchedules.forEach(schedule => {
        tableBody.innerHTML += `
            <tr>
                <td>${schedule.busNumber}</td>
                <td>${schedule.routeName}</td>
                <td>${to12Hour(schedule.departureTime)}</td>
                <td>${getStatusWithEmoji(schedule.status)}</td>
            </tr>
        `;
    });
}

function loadUpcomingDepartures() {

    const tableBody = document.getElementById("upcomingDeparturesBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    const schedules = JSON.parse(localStorage.getItem("schedules")) || [];
    const now = new Date();

    const upcoming = schedules.filter(schedule => {

        if (schedule.status === "Departed" || schedule.status === "Cancelled") {
            return false;
        }

        const departure = new Date(
            schedule.departureDate + "T" + schedule.departureTime
        );
        return departure >= now;
    });

    if (upcoming.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">
                    No upcoming departures
                </td>
            </tr>
        `;

        return;
    }

    upcoming.sort((a, b) => {

        return new Date(a.departureDate + "T" + a.departureTime)
            - new Date(b.departureDate + "T" + b.departureTime);
    });

    upcoming.forEach(schedule => {

        const departure = new Date(
            schedule.departureDate + "T" + schedule.departureTime
        );

        const diff = departure - now;
        const totalMinutes = Math.floor(diff / (1000 * 60));
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
        const minutes = totalMinutes % 60;

        let countdown = "";

        if (days > 1) {
            countdown = ` 🗓️ in ${days} days`;
        }
        else if (days === 1) {
            countdown = "📆 Tomorrow";
        }
        else if (hours > 0) {
            countdown = ` ⏳ ${hours} hr ${minutes} mins left`;
        }
        else {
            countdown = ` ⌛ ${minutes} mins left`;
        }

        tableBody.innerHTML += `
            <tr>
                <td>${schedule.busNumber}</td>
                <td>${schedule.routeName}</td>
                <td>${to12Hour(schedule.departureTime)}</td>
                <td>${countdown}</td>
            </tr>
        `;
    });
}

function loadDashboardInsights() {
    const popularRouteElement = document.getElementById("popularRoute");
    if (!popularRouteElement) return;

    const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const buses = JSON.parse(localStorage.getItem("buses")) || [];

    // Active bookings only
    const activeBookings = bookings.filter(booking =>
        booking.bookingStatus !== "Cancelled" &&
        booking.bookingStatus !== "Expired" &&
        booking.bookingStatus !== "Departed"
    );

    // ===========================
    // Most Popular Route
    // ===========================
    const routeCount = {};

    activeBookings.forEach(booking => {
        if (!routeCount[booking.route]) {
            routeCount[booking.route] = 0;
        }
        routeCount[booking.route]++;
    });

    let popularRoute = "--";
    let highest = 0;

    Object.keys(routeCount).forEach(route => {
        if (routeCount[route] > highest) {
            highest = routeCount[route];
            popularRoute = route;
        }
    });

    // ===========================
    // Bus Occupancy
    // ===========================
    let totalSeats = 0;

    buses.forEach(bus => {
        totalSeats += Number(bus.capacity || 0);
    });

    const occupiedSeats = activeBookings.length;

    const occupancy =
        totalSeats > 0
            ? Math.round((occupiedSeats / totalSeats) * 100)
            : 0;

    // ===========================
    // Average Fare
    // ===========================
    const paidBookings = bookings.filter(
        booking => booking.paymentStatus === "Paid"
    );

    const totalRevenue = paidBookings.reduce(
        (sum, booking) => sum + Number(booking.ticketPrice || 0),
        0
    );

    const averageFare =
        paidBookings.length > 0
            ? Math.round(totalRevenue / paidBookings.length)
            : 0;

    // ===========================
    // Today's Bookings
    // ===========================
    const today = new Date().toLocaleDateString();

    const todayBookings = bookings.filter(booking => {
        return new Date(booking.bookingDate).toLocaleDateString() === today;
    }).length;

    // ===========================
    // Display Results
    // ===========================
    popularRouteElement.textContent = popularRoute;
    document.getElementById("occupancyRate").textContent = occupancy + "%";
    document.getElementById("averageFare").textContent =
        "₦" + averageFare.toLocaleString();
    document.getElementById("todayBookings").textContent = todayBookings;

}


function getChartTheme() {

    const isDark = document.body.classList.contains("dark-mode");

    return {
        textColor: isDark ? "#e5e7eb" : "#333333",
        gridColor: isDark ? "#374151" : "#e5e7eb",
        borderColor: isDark ? "#4b5563" : "#dee2e6"
    };

}


/* =========================================================
   SCHEDULE STATUS CHART
   ========================================================= */

function loadScheduleStatusChart() {

    const chartCanvas =
        document.getElementById("scheduleStatusChart");

    if (!chartCanvas) return;

    const schedules =
        JSON.parse(localStorage.getItem("schedules")) || [];

    const scheduled =
        schedules.filter(s => s.status === "Scheduled").length;

    const boarding =
        schedules.filter(s => s.status === "Boarding").length;

    const delayed =
        schedules.filter(s => s.status === "Delayed").length;

    const departed =
        schedules.filter(s => s.status === "Departed").length;

    const cancelled =
        schedules.filter(s => s.status === "Cancelled").length;


    if (scheduleChart) {
        scheduleChart.destroy();
    }


    const theme = getChartTheme();


    scheduleChart = new Chart(chartCanvas, {

        type: "pie",

        data: {

            labels: [
                "Scheduled",
                "Boarding",
                "Delayed",
                "Departed",
                "Cancelled"
            ],

            datasets: [{

                data: [
                    scheduled,
                    boarding,
                    delayed,
                    departed,
                    cancelled
                ],

                backgroundColor: [
                    "#28a745",
                    "#007bff",
                    "#ffc107",
                    "#dc3545",
                    "#6c757d"
                ],

                borderColor: theme.borderColor,

                borderWidth: 2

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    position: "bottom",

                    labels: {
                        color: theme.textColor
                    }

                }

            }

        }

    });

}


/* =========================================================
   BOOKING STATUS CHART
   ========================================================= */

function loadBookingStatusChart() {

    const chartCanvas =
        document.getElementById("bookingStatusChart");

    if (!chartCanvas) return;

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];


    const paid =
        bookings.filter(booking =>
            booking.paymentStatus === "Paid" &&
            booking.bookingStatus !== "Cancelled"
        ).length;


    const pending =
        bookings.filter(booking =>
            booking.paymentStatus === "Pending" &&
            booking.bookingStatus === "Active"
        ).length;


    const cancelled =
        bookings.filter(booking =>
            booking.bookingStatus === "Cancelled"
        ).length;


    const expired =
        bookings.filter(booking =>
            booking.bookingStatus === "Expired"
        ).length;


    if (bookingChart) {
        bookingChart.destroy();
    }


    const theme = getChartTheme();


    bookingChart = new Chart(chartCanvas, {

        type: "bar",

        data: {

            labels: [
                "Paid",
                "Pending",
                "Cancelled",
                "Expired"
            ],

            datasets: [{

                label: "Bookings",

                data: [
                    paid,
                    pending,
                    cancelled,
                    expired
                ],

                backgroundColor: [
                    "#28a745",
                    "#ffc107",
                    "#dc3545",
                    "#6c757d"
                ],

                borderRadius: 8

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    display: false
                }

            },

            scales: {

                x: {

                    ticks: {
                        color: theme.textColor
                    },

                    grid: {
                        color: theme.gridColor
                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {
                        precision: 0,
                        color: theme.textColor
                    },

                    grid: {
                        color: theme.gridColor
                    }

                }

            }

        }

    });

}


/* =========================================================
   REVENUE TREND CHART
   ========================================================= */

function loadRevenueTrendChart() {

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];


    const monthlyRevenue = {

        Jan: 0,
        Feb: 0,
        Mar: 0,
        Apr: 0,
        May: 0,
        Jun: 0,
        Jul: 0,
        Aug: 0,
        Sep: 0,
        Oct: 0,
        Nov: 0,
        Dec: 0

    };


    bookings.forEach(booking => {

        if (booking.paymentStatus !== "Paid") return;

        const date =
            new Date(booking.bookingDate);

        if (isNaN(date)) return;


        const month =
            date.toLocaleString("default", {
                month: "short"
            });


        monthlyRevenue[month] +=
            Number(booking.ticketPrice) || 0;

    });


    const ctx =
        document.getElementById("revenueTrendChart");

    if (!ctx) return;


    if (revenueChart) {
        revenueChart.destroy();
    }


    const theme = getChartTheme();


    revenueChart = new Chart(ctx, {

        type: "line",

        data: {

            labels:
                Object.keys(monthlyRevenue),

            datasets: [{

                label: "Revenue (₦)",

                data:
                    Object.values(monthlyRevenue),

                tension: 0.4,

                fill: false,

                borderWidth: 3,

                pointRadius: 4,

                pointHoverRadius: 6

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    labels: {
                        color: theme.textColor
                    }

                }

            },

            scales: {

                x: {

                    ticks: {
                        color: theme.textColor
                    },

                    grid: {
                        color: theme.gridColor
                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {

                        color: theme.textColor,

                        callback: function (value) {
                            return "₦" +
                                Number(value).toLocaleString();
                        }

                    },

                    grid: {
                        color: theme.gridColor
                    }

                }

            }

        }

    });

}


/* =========================================================
   BUS STATISTICS CHART
   ========================================================= */

function loadBusStatisticsChart() {

    const buses =
        JSON.parse(localStorage.getItem("buses")) || [];


    const busTypes = {};


    buses.forEach(bus => {

        const type =
            bus.busType || "Unknown";


        if (!busTypes[type]) {
            busTypes[type] = 0;
        }


        busTypes[type]++;

    });


    const canvas =
        document.getElementById("busStatisticsChart");

    if (!canvas) return;


    if (busStatisticsChart) {
        busStatisticsChart.destroy();
    }


    const theme = getChartTheme();


    busStatisticsChart =
        new Chart(canvas, {

            type: "pie",

            data: {

                labels:
                    Object.keys(busTypes),

                datasets: [{

                    data:
                        Object.values(busTypes),

                    backgroundColor: [

                        "#3498db",
                        "#2ecc71",
                        "#f1c40f",
                        "#e74c3c",
                        "#9b59b6",
                        "#1abc9c",
                        "#34495e"

                    ],

                    borderColor:
                        theme.borderColor,

                    borderWidth: 2

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    title: {

                        display: true,

                        text:
                            "Bus Type Distribution",

                        color:
                            theme.textColor

                    },

                    legend: {

                        position: "bottom",

                        labels: {
                            color: theme.textColor
                        }

                    }

                }

            }

        });

}


/* =========================================================
   TOP ROUTES CHART
   ========================================================= */

function loadTopRoutesChart() {

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];


    const activeBookings =
        bookings.filter(booking =>

            booking.bookingStatus !== "Cancelled" &&
            booking.bookingStatus !== "Expired" &&
            booking.bookingStatus !== "Departed"

        );


    const routes = {};


    activeBookings.forEach(booking => {

        const route =
            booking.route || "Unknown";


        if (!routes[route]) {
            routes[route] = 0;
        }


        routes[route]++;

    });


    const sortedRoutes =
        Object.entries(routes)

            .sort((a, b) => b[1] - a[1])

            .slice(0, 5);


    const ctx =
        document.getElementById("topRoutesChart");

    if (!ctx) return;


    if (topRoutesChart) {
        topRoutesChart.destroy();
    }


    const theme = getChartTheme();


    topRoutesChart =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels:
                    sortedRoutes.map(item => item[0]),

                datasets: [{

                    label: "Bookings",

                    data:
                        sortedRoutes.map(item => item[1]),

                    backgroundColor: [

                        "#3498db",
                        "#2ecc71",
                        "#f1c40f",
                        "#9b59b6",
                        "#e74c3c"

                    ],

                    borderRadius: 8

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    },

                    title: {

                        display: true,

                        text:
                            "Top 5 Most Booked Routes",

                        color:
                            theme.textColor

                    }

                },

                scales: {

                    x: {

                        ticks: {
                            color: theme.textColor
                        },

                        grid: {
                            color: theme.gridColor
                        }

                    },

                    y: {

                        beginAtZero: true,

                        ticks: {

                            precision: 0,

                            color: theme.textColor

                        },

                        grid: {
                            color: theme.gridColor
                        }

                    }

                }

            }

        });

}


/* =========================================================
   PASSENGER GENDER CHART
   ========================================================= */

function loadGenderChart() {

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];


    const activeBookings =
        bookings.filter(booking =>

            booking.bookingStatus !== "Cancelled" &&
            booking.bookingStatus !== "Expired" &&
            booking.bookingStatus !== "Departed"

        );


    let male = 0;
    let female = 0;


    activeBookings.forEach(booking => {

        if (
            (booking.gender || "")
                .toLowerCase() === "male"
        ) {
            male++;
        }


        if (
            (booking.gender || "")
                .toLowerCase() === "female"
        ) {
            female++;
        }

    });


    const ctx =
        document.getElementById("genderChart");

    if (!ctx) return;


    if (genderChart) {
        genderChart.destroy();
    }


    const theme = getChartTheme();


    genderChart =
        new Chart(ctx, {

            type: "doughnut",

            data: {

                labels: [
                    "Male",
                    "Female"
                ],

                datasets: [{

                    data: [
                        male,
                        female
                    ],

                    backgroundColor: [
                        "#3498db",
                        "#e91e63"
                    ],

                    borderColor:
                        theme.borderColor,

                    borderWidth: 2

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    title: {

                        display: true,

                        text:
                            "Passenger Gender Distribution",

                        color:
                            theme.textColor

                    },

                    legend: {

                        position: "bottom",

                        labels: {
                            color: theme.textColor
                        }

                    }

                }

            }

        });

}

function loadTopRoutes() {

    const tableBody = document.getElementById("topRoutesTable");

    if (!tableBody) return;

    const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const routeCounts = {};
    bookings.forEach(booking => {
        // Ignore cancelled and expired bookings
        if (
            booking.bookingStatus === "Cancelled" ||
            booking.bookingStatus === "Expired"
        ) return;

        const route = booking.route;

        routeCounts[route] = (routeCounts[route] || 0) + 1;
    });

    const sortedRoutes = Object.entries(routeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    if (sortedRoutes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    No booking Data
                </td>
            </tr>
        `;
        return;
    }

    const metals = ["🥇", "🥈", "🥉 "];

    sortedRoutes.forEach((route, index) => {

        tableBody.innerHTML += `
            <tr>
                <td>${metals[index]}</td>
                <td>${route[0]}</td>
                <td>${route[1]}</td>
            </tr>
        `;
    })
}

//============================
//TimeStamp
//======================
function timeAgo(dateString) {

    const TimeStamp = new Date(dateString).getTime();

    let seconds = Math.floor((Date.now() - TimeStamp) / 1000);
    if (seconds < 60) return "just now";

    let minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "min ago";

    let hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "hr ago";

    let days = Math.floor(hours / 24);
    return days + "day(s) ago";

}

document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("totalRevenue")) {
        calculateRevenue();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("bookingTableBody")
    ) {
        loadBookings();
    }

    const searchBooking = document.getElementById("searchBooking");

    if (searchBooking) {
        searchBooking.addEventListener("input", loadBookings);
    }
});


function removeExpiredBookings() {
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    let updated = false;

    const now = new Date();
    bookings.forEach(booking => {



        if (
            booking.bookingStatus === "Cancelled" ||
            booking.bookingStatus === "Expired"
        ) {
            return;
        }

        if (booking.bookingStatus === "Expired") {
            return;
        }

        // Skip if no departure date/Time
        if (!booking.departureDate || !booking.departureTime) return;

        const departure = new Date(
            booking.departureDate + "T" + booking.departureTime
        );



        if (now >= departure) {
            booking.bookingStatus = "Expired";
            booking.seatStatus = "Available";
            updated = true;
        }

    });

    if (updated) {
        localStorage.setItem("bookings", JSON.stringify(bookings));
    }



}


function refreshDashboard() {
    loadDashboardStats();
    loadRecentActivities();
    loadTodayDepartures();
    loadUpcomingDepartures();
    calculateRevenue();

    if (document.getElementById("scheduleStatusChart")) {
        loadScheduleStatusChart();
    }

    if (document.getElementById("bookingStatusChart")) {
        loadBookingStatusChart();
    }

    if (document.getElementById("revenueTrendChart")) {
        loadRevenueTrendChart();
    }

    if (document.getElementById("busStatisticsChart")) {
        loadBusStatisticsChart();
    }

    if (document.getElementById("topRoutesChart")) {
        loadTopRoutesChart();
    }

    if (document.getElementById("genderChart")) {
        loadGenderChart();
    }

    loadTopRoutes();
    if (typeof loadReports === "function") {
        loadReports();
    }

    updateDashboardTime();
    loadDashboardInsights();
}

window.addEventListener("storage", () => {
    loadDashboardStats();
    loadRecentActivities();
    calculateRevenue();
    loadTodayDepartures();
    loadUpcomingDepartures();
    loadScheduleStatusChart();
    loadBookingStatusChart();
    loadRevenueTrendChart();
    loadBusStatisticsChart();
    loadTopRoutesChart();
    loadGenderChart();
    loadTopRoutes();
    updateDashboardTime();
    loadDashboardInsights();
});


//welcome user section
function displayLoggedInUser() {

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) return;

    const welcomeUser = document.getElementById("welcomeUser");
    const userRole = document.getElementById("userRole");

    if (welcomeUser) {
        const firstName = currentUser.fullName.split(" ")[0];

        welcomeUser.textContent = `Welcome, ${firstName}`;
    }

    if (userRole) {
        const roleName =
            currentUser.role === "admin"
                ? "👑 Administrator"
                : "👤 User";

        userRole.textContent = roleName;
    }

}

//Available schedules section

let selectedSchedule = null;
let renderedAvailableSchedules = [];


function loadAvailableSchedules() {

    const tableBody =
        document.getElementById("availableScheduleBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    const schedules =
        JSON.parse(localStorage.getItem("schedules")) || [];

    const routes =
        JSON.parse(localStorage.getItem("routes")) || [];

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const drivers =
        JSON.parse(localStorage.getItem("drivers")) || [];

    const buses =
        JSON.parse(localStorage.getItem("buses")) || [];


    const searchInput =
        document.getElementById("searchAvailableSchedule");

    const search =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    // const availableSchedules = schedules.filter(schedule => {
    renderedAvailableSchedules = schedules.filter(schedule => {

        // Don't display cancelled or departed schedules
        if (
            schedule.status === "Cancelled" ||
            schedule.status === "Departed"
        ) {
            return false;
        }


        // Normalize the schedule bus
        const scheduleBus =
            String(schedule.busNumber || "")
                .replace(/\s+/g, "")
                .toLowerCase();


        // Find the actual bus
        const bus = buses.find(bus => {

            const busValue =
                `${bus.busNumber}-${bus.busType}`
                    .replace(/\s+/g, "")
                    .toLowerCase();

            return busValue === scheduleBus;
        });


        // If the bus doesn't exist, don't display the schedule
        if (!bus) {
            return false;
        }


        // Count active bookings for this exact bus
        const bookedSeats = bookings.filter(booking => {

            if (
                booking.bookingStatus === "Cancelled" ||
                booking.bookingStatus === "Expired" ||
                booking.bookingStatus === "Departed"
            ) {
                return false;
            }


            const bookingBus =
                booking.selectedBus ||
                (
                    booking.busNumber && booking.busType
                        ? `${booking.busNumber}-${booking.busType}`
                        : booking.busNumber
                );


            if (!bookingBus) {
                return false;
            }


            const normalizedBookingBus =
                String(bookingBus)
                    .replace(/\s+/g, "")
                    .toLowerCase();


            return normalizedBookingBus === scheduleBus;

        }).length;


        // If the bus is full, DON'T display the schedule
        if (bookedSeats >= Number(bus.capacity)) {
            return false;
        }


        // Search filter
        return (
            String(schedule.state || "")
                .toLowerCase()
                .includes(search) ||

            String(schedule.routeName || "")
                .toLowerCase()
                .includes(search) ||

            String(schedule.busNumber || "")
                .toLowerCase()
                .includes(search)
        );
    });
    // if (availableSchedules.length === 0) {
    if (renderedAvailableSchedules.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center;">
                    No available schedules.
                </td>
            </tr>
        `;

        return;
    }







    // availableSchedules.forEach((schedule, index) => {
    renderedAvailableSchedules.forEach((schedule, index) => {


        /*
         * Normalize the schedule bus number.
         *
         * Example:
         * B001 - Luxury
         * becomes:
         * b001-luxury
         */
        const scheduleBus =
            String(schedule.busNumber || "")
                .replace(/\s+/g, "")
                .toLowerCase();


        /*
         * Find the driver assigned to this exact bus.
         */
        const driver = drivers.find(driver => {

            const driverBus =
                String(driver.busNumber || "")
                    .replace(/\s+/g, "")
                    .toLowerCase();

            return driverBus === scheduleBus;
        });


        /*
         * Find route.
         */
        const route = routes.find(route => {

            return (
                route.routeName === schedule.routeName &&
                route.busType === schedule.busNumber
            );

        });


        /*
         * Find bus.
         */
        const bus = buses.find(bus => {

            const busValue =
                `${bus.busNumber}-${bus.busType}`
                    .replace(/\s+/g, "")
                    .toLowerCase();

            return busValue === scheduleBus;

        });


        /*
         * Count active bookings.
         */
        const bookedSeats =
            bookings.filter(booking => {

                if (
                    booking.bookingStatus === "Cancelled" ||
                    booking.bookingStatus === "Expired" ||
                    booking.bookingStatus === "Departed"
                ) {
                    return false;
                }


                const bookingBus =
                    booking.selectedBus ||
                    (
                        booking.busNumber &&
                            booking.busType
                            ? `${booking.busNumber}-${booking.busType}`
                            : booking.busNumber
                    );


                if (!bookingBus) {
                    return false;
                }


                const normalizedBookingBus =
                    String(bookingBus)
                        .replace(/\s+/g, "")
                        .toLowerCase();


                return normalizedBookingBus === scheduleBus;

            }).length;


        /*
         * Calculate seats remaining.
         */
        const capacity =
            bus ? Number(bus.capacity) : 0;


        const seatsLeft =
            Math.max(capacity - bookedSeats, 0);


        tableBody.innerHTML += `

            <tr
                id="scheduleRow${index}"
                onclick="selectSchedule(${index})"
            >

                <td>
                    ${schedule.state}
                </td>

                <td>
                    ${schedule.routeName}
                </td>

                <td>
                    ${schedule.busNumber}
                </td>

                <td>
                    ${driver ? driver.driverName : "-"}
                </td>

                <td>
                    ${schedule.departureDate}
                </td>

                <td>
                    ${to12Hour(schedule.departureTime)}
                </td>

                <td>
                    ₦${route
                ? Number(route.fare).toLocaleString()
                : "0"}
                </td>

                <td>
                    ${seatsLeft}
                </td>

                <td>
                    ${getStatusWithEmoji(schedule.status)}
                </td>

            </tr>
        `;
    });
}



function selectSchedule(index) {

    const schedules =
        JSON.parse(localStorage.getItem("schedules")) || [];

    const routes =
        JSON.parse(localStorage.getItem("routes")) || [];

    const bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const drivers =
        JSON.parse(localStorage.getItem("drivers")) || [];

    const buses =
        JSON.parse(localStorage.getItem("buses")) || [];


    // // Get only schedules that are still available
    // const availableSchedules = schedules.filter(schedule =>
    //     schedule.status !== "Cancelled" &&
    //     schedule.status !== "Departed"
    // );


    // // Get the selected schedule
    // selectedSchedule = availableSchedules[index];
    // Get the exact schedule displayed in the clicked table row
    selectedSchedule = renderedAvailableSchedules[index];


    if (!selectedSchedule) {
        alert("Schedule not found.");
        return;
    }


    // Normalize the selected schedule bus value
    //
    // Example:
    // B001 - Luxury
    // becomes:
    // b001-luxury
    //
    const scheduleBus =
        String(selectedSchedule.busNumber || "")
            .replace(/\s+/g, "")
            .toLowerCase();


    // Find the bus
    const bus = buses.find(bus => {

        const busValue =
            `${bus.busNumber}-${bus.busType}`
                .replace(/\s+/g, "")
                .toLowerCase();

        return busValue === scheduleBus;
    });


    // Find the route
    const route = routes.find(route => {

        const routeBus =
            String(route.busType || "")
                .replace(/\s+/g, "")
                .toLowerCase();

        return (
            route.routeName === selectedSchedule.routeName &&
            routeBus === scheduleBus
        );
    });


    // Find the driver assigned to the selected bus
    const driver = drivers.find(driver => {

        const driverBus =
            String(driver.busNumber || "")
                .replace(/\s+/g, "")
                .toLowerCase();

        return driverBus === scheduleBus;
    });


    // Count active bookings for this exact bus
    const bookedSeats = bookings.filter(booking => {

        // Ignore cancelled, expired and departed bookings
        if (
            booking.bookingStatus === "Cancelled" ||
            booking.bookingStatus === "Expired" ||
            booking.bookingStatus === "Departed"
        ) {
            return false;
        }


        // Get the bus stored in the booking
        const bookingBus =
            booking.selectedBus ||
            (
                booking.busNumber && booking.busType
                    ? `${booking.busNumber}-${booking.busType}`
                    : booking.busNumber
            );


        if (!bookingBus) {
            return false;
        }


        // Normalize booking bus
        const normalizedBookingBus =
            String(bookingBus)
                .replace(/\s+/g, "")
                .toLowerCase();


        // Only count bookings belonging to this exact bus
        return normalizedBookingBus === scheduleBus;

    }).length;


    // Get bus capacity
    const capacity =
        bus ? Number(bus.capacity) : 0;


    // Calculate seats left
    const seatsLeft =
        Math.max(capacity - bookedSeats, 0);


    // Remove previous selected row
    document
        .querySelectorAll("#availableScheduleBody tr")
        .forEach(row => {
            row.classList.remove("selectedSchedule");
        });


    // Highlight selected row
    const selectedRow =
        document.getElementById(`scheduleRow${index}`);


    if (selectedRow) {
        selectedRow.classList.add("selectedSchedule");
    }


    // Display trip details
    document.getElementById("tripDetails").innerHTML = `

        <h3>Trip Details</h3>

        <p>
            <strong>State:</strong>
            ${selectedSchedule.state}
        </p>

        <p>
            <strong>Route:</strong>
            ${selectedSchedule.routeName}
        </p>

        <p>
            <strong>Bus:</strong>
            ${selectedSchedule.busNumber}
        </p>

        <p>
            <strong>Driver:</strong>
            ${driver ? driver.driverName : "Not Assigned"}
        </p>

        <p>
            <strong>Departure Date:</strong>
            ${selectedSchedule.departureDate}
        </p>

        <p>
            <strong>Departure Time:</strong>
            ${to12Hour(selectedSchedule.departureTime)}
        </p>

        <p>
            <strong>Fare:</strong>
            ₦${route
            ? Number(route.fare).toLocaleString()
            : "0"}
        </p>

        <p>
            <strong>Seats Left:</strong>
            ${seatsLeft}
        </p>

        <p>
            <strong>Status:</strong>
            ${selectedSchedule.status}
        </p>

    `;


    // Enable the Book Ticket button
    const bookButton =
        document.getElementById("bookTicketBtn");

    if (bookButton) {
        bookButton.disabled = false;
    }
}
function bookSelectedTicket() {

    if (!selectedSchedule) {
        alert("Please select a schedule first.");
        return;
    }

    localStorage.setItem(
        "selectedSchedule",
        JSON.stringify(selectedSchedule)
    );

    window.location.href = "bookings.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchAvailableSchedule");

    if (searchInput) {
        searchInput.addEventListener("input", loadAvailableSchedules);
    }

    if (document.getElementById("availableScheduleBody")) {
        loadAvailableSchedules();
    }

});


function printReport() {

    const reportSection = document.getElementById("reportContainer");

    if (!reportSection) {
        alert("Report section not found.");
        return;
    }

    const reportNumber = "REP-" +
        new Date().getFullYear() +
        String(new Date().getMonth() + 1).padStart(2, "0") +
        String(new Date().getDate()).padStart(2, "0") +
        "-" +
        Math.floor(Math.random() * 900 + 100);


    const printWindow = window.open("", "_blank");



    printWindow.document.write(`
<!DOCTYPE html>
<html>

<head>

<title>AGE TRANSIT COMPANY - Management Report</title>

<style>

body{
    font-family:Arial,sans-serif;
    margin:30px;
    color:#222;
}

.header{
    text-align:center;
    border-bottom:3px solid #003366;
    padding-bottom:15px;
    margin-bottom:25px;
}

.header h1{
    margin:0;
    color:#003366;
    font-size:32px;
}

.header h2{
    margin:5px 0;
    font-size:22px;
}

.header p{
    color:#555;
    font-size:15px;
}

.dashboard-cards{

    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:15px;
    margin-bottom:25px;

}

.card{

    border:1px solid #ccc;
    border-radius:8px;
    padding:15px;
    text-align:center;
    background:#fafafa;

}
.section-summary{
    grid-template-columns: repeat(1fr);
}

.card h3{

    margin:8px 0;
    font-size:17px;

}

.card p{
    font-size:28px;
    color:#003366;
    margin:10px 0;
}
.card h1{

    font-size:28px;
    color:#003366;
    margin:10px 0;

}



.staff-summary div{

    display:flex;
    justify-content:space-between;
    padding:6px 0;
    border-bottom:1px solid #eee;

}

table{

    width:100%;
    border-collapse:collapse;
    margin-top:20px;

}

table th{

    background:#003366;
    color:white;

}

table th{
    border:1px solid #999;
    padding:10px;
    text-align:left;
    background: #0b3d91;
    color: white;
}
table td{

    border:1px solid #999;
    padding:10px;
    text-align:left;

}

table tr:nth-child(even){

    background:#f5f5f5;

}

.report-info{

width:100%;
margin:20px 0;
border-collapse:collapse;

}

.report-info td{

border:1px solid #999;
padding:8px;

}

.report-info td:first-child{

background:#f3f3f3;
font-weight:bold;
width:180px;

}

.report-footer{
    display: none;
}

.watermark{
    position: fixed;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 80px;
    font-weight: bold;
    color: rgba(0,0,0,0.08);
    z-index: -1;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
}

.signature{
    margin-top: 20px;
}

.footer{

    margin-top:60px;
    text-align:center;
    font-size:13px;
    color:#666;
    border-top:2px solid #003366;
    padding-top:10px;

}


@media print{

    body{
        margin:15mm;
    }

    .report-action{
        display:none;
    }
    .report-section{
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 25px;
    }

    .report-card{
        padding:10px;
        min-height:70px;
    }

    .report-card h3{
        margin:0;
        font-size:13px;
    }

    .report-card p{
        margin-top:8px;
        font-size:24px;
    }
    .report-card h1{
        margin-top:8px;
        font-size:24px;
    }
}

</style>

</head>

<body>
<div class="watermark">TRANSNOVA EXPRESS</div>

<div class="header">

<h1>TRANSNOVA EXPRESS</h1>

<h2>Bus Terminal Management System</h2>

<h3>Management Report</h3>
<table class="report-info">

<tr>
<td><strong>Report No.</strong></td>
<td>${reportNumber}</td>
</tr>

<tr>
<td><strong>Generated On</strong></td>
<td>${new Date().toLocaleString()}</td>
</tr>

<tr>
<td><strong>Generated By</strong></td>
<td>System Administrator</td>
</tr>

<tr>
<td><strong>Company</strong></td>
<td>AGE TRANSIT COMPANY</td>
</tr>

</table>

</div>

${reportSection.innerHTML}

<div class="footer">

    Generated by Bus Terminal Management System

    <br><br>

    © 2026 AGE TRANSIT COMPANY

</div>


</body>


</html>
`);

    printWindow.document.close();

    setTimeout(() => {

        printWindow.print();

        printWindow.close();

    }, 500);

}

const reportNumber = "REP-" + new Date().getFullYear() +
    String(new Date().getMonth() + 1).padStart(2, "0") +
    String(new Date().getDate()).padStart(2, "0") + "-" +
    Math.floor(Math.random() * 900 + 100);

function exportReportToExcel() {

    const workbook = XLSX.utils.book_new();

    /* ==============================
       Fleet Summary
    ============================== */

    const fleetData = [
        ["TRANSNOVA EXPRESS"],
        ["Bus Terminal Management System"],
        [""],
        ["Report No.", reportNumber],
        ["Generated On.", new Date().toLocaleString()],
        [""],
        ["Fleet Summary", ""],
        ["Total Buses", document.getElementById("reportBuses").textContent],
        ["Total Routes", document.getElementById("reportRoutes").textContent],
        ["Active Schedules", document.getElementById("reportSchedules").textContent],
        ["Active Bookings", document.getElementById("reportBookings").textContent]
    ];

    const fleetSheet = XLSX.utils.aoa_to_sheet(fleetData);

    fleetSheet["!cols"] = [
        { wch: 30 },
        { wch: 25 }
    ]

    XLSX.utils.book_append_sheet(
        workbook,
        fleetSheet,
        "Fleet Summary"
    );



    /* ==============================
       Schedule Summary
    ============================== */

    const scheduleData = [
        ["TRANSNOVA EXPRESS"],
        ["Bus Terminal Management System"],
        [""],
        ["Report No.", reportNumber],
        ["Generated On.", new Date().toLocaleString()],
        [""],

        ["Schedule Summary", ""],

        ["Scheduled", document.getElementById("reportScheduled").textContent],

        ["Boarding", document.getElementById("reportBoarding").textContent],

        ["Delayed", document.getElementById("reportDelayed").textContent],

        ["Departed", document.getElementById("reportDeparted").textContent],

        ["Cancelled", document.getElementById("reportCancelled").textContent]

    ];

    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);

    scheduleSheet["!cols"] = [
        { wch: 30 },
        { wch: 25 }
    ]

    XLSX.utils.book_append_sheet(
        workbook,
        scheduleSheet,
        "Schedule Summary"
    );



    /* ==============================
       Staff Summary
    ============================== */

    const staffData = [
        ["TRANSNOVA EXPRESS"],
        ["Bus Terminal Management System"],
        [""],
        ["Report No.", reportNumber],
        ["Generated On.", new Date().toLocaleString()],
        [""],

        ["Staff Summary", ""],

        ["Total Staff", document.getElementById("reportStaff").textContent],

        ["Drivers", document.getElementById("reportDrivers").textContent],

        ["Conductors", document.getElementById("reportConductors").textContent],

        ["Cashiers", document.getElementById("reportCashier").textContent],

        ["Terminal Officers", document.getElementById("reportTerminal").textContent],

        ["Managers", document.getElementById("reportManagers").textContent],

        ["Security", document.getElementById("reportSecurity").textContent],

        ["Male", document.getElementById("reportMale").textContent],

        ["Female", document.getElementById("reportFemale").textContent]

    ];

    const staffSheet = XLSX.utils.aoa_to_sheet(staffData);

    staffSheet["!cols"] = [
        { wch: 30 },
        { wch: 25 }
    ]

    XLSX.utils.book_append_sheet(
        workbook,
        staffSheet,
        "Staff Summary"
    );



    /* ==============================
       Revenue Summary
    ============================== */

    const revenueData = [
        ["TRANSNOVA EXPRESS"],
        ["Bus Terminal Management System"],
        [""],
        ["Report No.", reportNumber],
        ["Generated On.", new Date().toLocaleString()],
        [""],

        ["Revenue Summary", ""],

        ["Total Revenue", document.getElementById("reportRevenue").textContent],

        ["Paid Bookings", document.getElementById("reportPaid").textContent],

        ["Pending Payment", document.getElementById("reportPending").textContent],

        ["Cancelled Bookings", document.getElementById("reportCancelledBooking").textContent]

    ];

    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);

    revenueSheet["!cols"] = [
        { wch: 30 },
        { wch: 25 }
    ]

    XLSX.utils.book_append_sheet(
        workbook,
        revenueSheet,
        "Revenue Summary"
    );



    /* ==============================
       System Summary
    ============================== */

    const systemTable = document.querySelector("#reportContainer table");

    const systemSheet = XLSX.utils.table_to_sheet(systemTable);

    systemSheet["!cols"] = [
        { wch: 30 },
        { wch: 25 }
    ]

    XLSX.utils.book_append_sheet(
        workbook,
        systemSheet,
        "System Summary"
    );



    const today = new Date().toISOString().split("T")[0];

    XLSX.writeFile(
        workbook,
        `AGE_TRANSIT_COMPANY_Management_Report_${today}.xlsx`
    );

}

function updateDashboardTime() {

    const update = document.getElementById("dashboardLastUpdated");

    if (!update) return;

    const now = new Date();

    update.textContent =
        "Last Updated: " +
        now.toLocaleString();

}


const exportBtn = document.getElementById("exportDataBtn");
if (exportBtn) {
    exportBtn.addEventListener("click", exportBackup);
}

function exportBackup() {
    const backup = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        backup[key] = JSON.parse(localStorage.getItem(key));
    }

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "BusTerminal_Backup.json";

    link.click();

    URL.revokeObjectURL(link.href);

    loadNotifyMessage("backupExport");

    alert("Backup exported successfully.");
}

const importBtn = document.getElementById("importDataBtn");

if (importBtn) {
    importBtn.addEventListener("click", function () {
        document.getElementById("importBackup").click();
    });
}

const importBackup = document.getElementById("importBackup");

if (importBackup) {
    importBackup.addEventListener("change", restoreBackup);
}

//document.getElementById("importBackup").addEventListener("change", restoreBackup);

function restoreBackup(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const backup = JSON.parse(e.target.result);

            localStorage.clear();

            Object.keys(backup).forEach(key => {
                localStorage.setItem(key, JSON.stringify(backup[key]));
            });

            loadNotifyMessage("backupRestore");

            alert("Backup restored successfully.\nReloading system...");

            location.reload();

        } catch (error) {
            alert("Invalid backup file.");
        }
    };

    reader.readAsText(file);
}

// //Notification section

// =========================================================
// NOTIFICATION SYSTEM
// =========================================================

const notificationBtn = document.getElementById("notificationBtn");
const notificationPanel = document.getElementById("notificationPanel");


// =========================================================
// STATE NORMALIZER
// =========================================================

function normalizeNotificationState(state) {

    return String(state || "")
        .trim()
        .toLowerCase()
        .replace(/\s+state$/i, "");

}


// =========================================================
// GET CURRENT USER
// =========================================================

function getNotificationUser() {

    return JSON.parse(
        localStorage.getItem("currentUser")
    );

}


// =========================================================
// ADMIN / STAFF NOTIFICATION BUTTON
// =========================================================

if (notificationBtn && notificationPanel) {

    const clearBtn =
        document.getElementById("clearNotificationsBtn");


    if (clearBtn) {

        clearBtn.addEventListener("click", function (e) {

            e.stopPropagation();

            clearAllNotifications();

        });

    }


    notificationBtn.addEventListener("click", function (e) {

        e.stopPropagation();

        const isOpening =
            notificationPanel.style.display !== "block";


        notificationPanel.style.display =
            isOpening ? "block" : "none";


        if (isOpening) {

            markCurrentUserNotificationsAsRead();

            loadNotifications();

        }

    });


    document.addEventListener("click", function () {

        notificationPanel.style.display = "none";

    });


    notificationPanel.addEventListener(
        "click",
        function (e) {

            e.stopPropagation();

        }
    );

}


// =========================================================
// MARK ONLY CURRENT USER'S NOTIFICATIONS AS READ
// =========================================================

function markCurrentUserNotificationsAsRead() {

    let notifications =
        JSON.parse(
            localStorage.getItem("notifications")
        ) || [];


    const currentUser =
        getNotificationUser();


    if (!currentUser) return;


    // ADMIN
    if (currentUser.role === "admin") {

        notifications.forEach(notification => {

            if (
                notification.recipientType === "admin"
            ) {

                notification.read = true;

            }

        });

    }


    // STAFF

    // STAFF
    else if (currentUser.role === "staff") {

        const staffState =
            normalizeNotificationState(
                currentUser.state
            );

        notifications.forEach(notification => {

            if (
                notification.recipientType === "staff" &&
                normalizeNotificationState(
                    notification.state
                ) === staffState
            ) {

                if (!notification.readByState) {
                    notification.readByState = {};
                }

                notification.readByState[staffState] = true;

            }

        });

    }
    // else if (currentUser.role === "staff") {

    //     const staffState =
    //         normalizeNotificationState(
    //             currentUser.state
    //         );


    //     notifications.forEach(notification => {

    //         if (
    //             notification.recipientType === "staff" &&
    //             normalizeNotificationState(
    //                 notification.state
    //             ) === staffState
    //         ) {

    //             notification.read = true;

    //         }

    //     });

    // }


    localStorage.setItem(
        "notifications",
        JSON.stringify(notifications)
    );

}


// =========================================================
// ADD NOTIFICATION
// =========================================================

function addNotification(message, options = {}) {

    let notifications =
        JSON.parse(
            localStorage.getItem("notifications")
        ) || [];


    const recipientType =
        options.recipientType || "admin";


    const state =
        options.state || "";


    const eventType =
        options.eventType || "general";


    notifications.unshift({

        id:
            "NTF-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 8),

        message: message,

        time:
            new Date().toLocaleString(),

        read: false,

        recipientType: recipientType,

        state: state,

        eventType: eventType

    });


    // Keep only the latest 50
    if (notifications.length > 50) {

        notifications =
            notifications.slice(0, 50);

    }


    localStorage.setItem(
        "notifications",
        JSON.stringify(notifications)
    );


    loadNotifications();

}


// =========================================================
// CREATE NOTIFICATIONS
// =========================================================

function loadNotifyMessage(type, data = {}) {

    switch (type) {


        // =================================================
        // BOOKING
        // =================================================

        case "booking":

            addNotification(
                `🎫 New booking received from ${data.passengerName} for ${data.route}.`
            );

            break;


        // =================================================
        // CANCEL
        // =================================================

        case "cancel":

            addNotification(
                `❌ Booking cancelled by ${data.passengerName}.`
            );

            break;


        // =================================================
        // BUS
        // =================================================

        case "bus":

            addNotification(
                `🚌 New bus (${data.busNumber}) has been added.`
            );

            break;


        // =================================================
        // ROUTE
        // =================================================

        case "route":

            addNotification(
                `🛣️ New route (${data.route}) has been created.`
            );

            break;


        // =================================================
        // SCHEDULE
        // =================================================

        case "schedule":

            addNotification(
                `📅 New schedule created for ${data.route}.`
            );

            break;


        // =================================================
        // BUS DEPARTED
        // =================================================

        case "departed": {

            const originState =
                String(data.originState || "").trim();


            const destinationState =
                String(data.destinationState || "").trim();


            const normalizedOrigin =
                normalizeNotificationState(
                    originState
                );


            const normalizedDestination =
                normalizeNotificationState(
                    destinationState
                );


            // ---------------------------------------------
            // ADMIN
            // ---------------------------------------------

            addNotification(

                `🚍 Bus ${data.busNumber} has departed ${originState}.`,

                {
                    recipientType: "admin",
                    state: "",
                    eventType: "departed"
                }

            );


            // ---------------------------------------------
            // ORIGIN STATE
            // DEPARTED ONLY
            // ---------------------------------------------

            if (originState) {

                addNotification(

                    `🚍 Bus ${data.busNumber} has departed ${originState}.`,

                    {
                        recipientType: "staff",
                        state: originState,
                        eventType: "departed"
                    }

                );

            }


            // ---------------------------------------------
            // DESTINATION STATE
            // INCOMING ONLY
            // ---------------------------------------------

            // IMPORTANT:
            // Do NOT create an incoming notification for
            // the origin state.
            //
            // Incoming belongs ONLY to the destination.

            if (
                destinationState &&
                normalizedDestination !== normalizedOrigin
            ) {

                addNotification(

                    `🚌 Bus ${data.busNumber} is in transit to ${destinationState}.`,

                    {
                        recipientType: "staff",
                        state: destinationState,
                        eventType: "incoming"
                    }

                );

            }


            // ---------------------------------------------
            // PLATFORM - DEPARTED
            // ---------------------------------------------

            addNotification(

                `🚍 Bus ${data.busNumber} has departed ${originState}.`,

                {
                    recipientType: "platform",
                    state: originState,
                    eventType: "departed"
                }

            );


            // ---------------------------------------------
            // PLATFORM - INCOMING
            // ---------------------------------------------

            if (
                destinationState &&
                normalizedDestination !== normalizedOrigin
            ) {

                addNotification(

                    `🚌 Bus ${data.busNumber} is incoming to ${destinationState}.`,

                    {
                        recipientType: "platform",
                        state: destinationState,
                        eventType: "incoming"
                    }

                );

            }


            break;

        }


        // =================================================
        // BUS ARRIVAL
        // =================================================

        case "arrival": {

            const originState =
                String(data.originState || "").trim();


            const destinationState =
                String(data.destinationState || "").trim();


            // ---------------------------------------------
            // ADMIN
            // ---------------------------------------------

            addNotification(

                `✅ Bus ${data.busNumber} has arrived at ${destinationState}. Arrival confirmed by ${data.confirmedBy}.`,

                {
                    recipientType: "admin",
                    state: "",
                    eventType: "arrival"
                }

            );


            // ---------------------------------------------
            // DESTINATION STAFF
            // ---------------------------------------------

            if (destinationState) {

                addNotification(

                    `✅ Bus ${data.busNumber} has arrived at ${destinationState}.`,

                    {
                        recipientType: "staff",
                        state: destinationState,
                        eventType: "arrival"
                    }

                );

            }


            // ---------------------------------------------
            // ORIGIN STAFF
            // ---------------------------------------------

            if (
                originState &&
                normalizeNotificationState(originState) !==
                normalizeNotificationState(destinationState)
            ) {

                addNotification(

                    `📍 Bus ${data.busNumber} has arrived at ${destinationState} from ${originState}.`,

                    {
                        recipientType: "staff",
                        state: originState,
                        eventType: "arrival"
                    }

                );

            }


            // ---------------------------------------------
            // PLATFORM
            // ---------------------------------------------

            addNotification(
                `✅ Bus ${data.busNumber} has arrived at ${destinationState}.`,
                {
                    recipientType: "platform",
                    state: destinationState,
                    eventType: "arrival"
                }
            );

            if (
                originState &&
                normalizeNotificationState(originState) !==
                normalizeNotificationState(destinationState)
            ) {
                addNotification(
                    `📍 Bus ${data.busNumber} has arrived at ${destinationState} from ${originState}.`,
                    {
                        recipientType: "platform",
                        state: originState,
                        eventType: "arrival"
                    }
                );
            }


            break;

        }


        // =================================================
        // OTHER NOTIFICATIONS
        // =================================================

        case "delayed":

            addNotification(
                `⏳ Bus ${data.busNumber} has been delayed.`
            );

            break;


        case "boarding":

            addNotification(
                `🚏 Boarding has started for bus ${data.busNumber}.`
            );

            break;


        case "full":

            addNotification(
                `💺 Bus ${data.busNumber} is now full.`
            );

            break;


        case "staff":

            addNotification(
                `👤 New staff (${data.staffName}) has been added.`
            );

            break;


        case "staffDeleted":

            addNotification(
                `🗑️ Staff (${data.staffName}) has been removed.`
            );

            break;


        case "user":

            addNotification(
                `👥 New passenger account created: ${data.username}.`
            );

            break;


        case "backupExport":

            addNotification(
                `💾 System backup exported successfully.`
            );

            break;


        case "backupRestore":

            addNotification(
                `♻️ System backup restored successfully.`
            );

            break;


        case "paymentVerified":

            addNotification(
                `💰 Payment verified for ${data.passengerName}. Amount: ₦${Number(data.amount || 0).toLocaleString()}.`
            );

            break;


        case "login":

            addNotification(
                `🔑 ${data.username} logged in successfully.`
            );

            break;


        case "logout":

            addNotification(
                `🚪 ${data.username} logged out.`
            );

            break;


        case "profile":

            addNotification(
                `👤 ${data.username} updated their profile.`
            );

            break;


        default:

            addNotification(
                "🔔 New system notification."
            );

    }

}


// =========================================================
// GET NOTIFICATIONS FOR CURRENT USER
// =========================================================

function getCurrentUserNotifications() {

    let notifications =
        JSON.parse(
            localStorage.getItem("notifications")
        ) || [];


    const currentUser =
        getNotificationUser();


    if (!currentUser) {

        return [];

    }


    // ---------------------------------------------
    // ADMIN
    // ---------------------------------------------

    if (currentUser.role === "admin") {

        return notifications.filter(notification => {

            return (
                notification.recipientType === "admin"
            );

        });

    }


    // ---------------------------------------------
    // STAFF
    // ---------------------------------------------

    if (currentUser.role === "staff") {

        const staffState =
            normalizeNotificationState(
                currentUser.state
            );


        return notifications.filter(notification => {

            if (
                notification.recipientType !== "staff"
            ) {

                return false;

            }


            const notificationState =
                normalizeNotificationState(
                    notification.state
                );


            return (
                notificationState === staffState
            );

        });

    }


    return [];

}


// =========================================================
// LOAD ADMIN / STAFF NOTIFICATIONS
// =========================================================

function loadNotifications() {

    const list =
        document.getElementById(
            "notificationList"
        );


    const count =
        document.getElementById(
            "notificationCount"
        );


    if (!list || !count) return;


    const notifications =
        getCurrentUserNotifications();


    list.innerHTML = "";


    if (notifications.length === 0) {

        list.innerHTML =
            "<li>No notifications</li>";

        count.textContent = "0";

        return;

    }


    notifications.forEach(
        (notification, index) => {

            list.innerHTML += `

                <li class="notification-item">

                    <div>

                        <strong>
                            ${notification.message}
                        </strong>

                        <br>

                        <small>
                            ${notification.time}
                        </small>

                    </div>


                    <button
                        class="delete-notification"
                        onclick="deleteNotification(${index})"
                    >

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </li>

            `;

        }
    );


    const unread =
        notifications.filter(
            notification =>
                notification.read === false
        ).length;


    count.textContent = unread;

}


// =========================================================
// DELETE ONE NOTIFICATION
// =========================================================

function deleteNotification(index) {

    let notifications =
        JSON.parse(
            localStorage.getItem("notifications")
        ) || [];


    const visibleNotifications =
        getCurrentUserNotifications();


    const notificationToDelete =
        visibleNotifications[index];


    if (!notificationToDelete) return;


    const realIndex =
        notifications.findIndex(
            notification =>
                notification.id ===
                notificationToDelete.id
        );


    if (realIndex === -1) return;


    notifications.splice(
        realIndex,
        1
    );


    localStorage.setItem(
        "notifications",
        JSON.stringify(notifications)
    );


    loadNotifications();

}


// =========================================================
// CLEAR CURRENT USER'S NOTIFICATIONS ONLY
// =========================================================

function clearAllNotifications() {

    if (
        !confirm(
            "Are you sure you want to clear your notifications?"
        )
    ) {

        return;

    }


    let notifications =
        JSON.parse(
            localStorage.getItem("notifications")
        ) || [];


    const currentUser =
        getNotificationUser();


    if (!currentUser) return;


    // ---------------------------------------------
    // ADMIN
    // ---------------------------------------------

    if (currentUser.role === "admin") {

        notifications =
            notifications.filter(
                notification =>
                    notification.recipientType !==
                    "admin"
            );

    }


    // ---------------------------------------------
    // STAFF
    // ---------------------------------------------

    else if (currentUser.role === "staff") {

        const staffState =
            normalizeNotificationState(
                currentUser.state
            );


        notifications =
            notifications.filter(
                notification => {

                    if (
                        notification.recipientType !==
                        "staff"
                    ) {

                        return true;

                    }


                    return (
                        normalizeNotificationState(
                            notification.state
                        ) !== staffState
                    );

                }
            );

    }


    localStorage.setItem(
        "notifications",
        JSON.stringify(notifications)
    );


    loadNotifications();

}


// =========================================================
// PLATFORM NOTIFICATIONS
// =========================================================

const platformNotificationBtn =
    document.getElementById(
        "platformNotificationBtn"
    );


const platformNotificationPanel =
    document.getElementById(
        "platformNotificationPanel"
    );


if (
    platformNotificationBtn &&
    platformNotificationPanel
) {

    const clearPlatformBtn =
        document.getElementById(
            "clearPlatformNotificationsBtn"
        );


    if (clearPlatformBtn) {

        clearPlatformBtn.addEventListener(
            "click",
            function (e) {

                e.stopPropagation();

                clearPlatformNotifications();

            }
        );

    }


    platformNotificationBtn.addEventListener(
        "click",
        function (e) {

            e.stopPropagation();


            const isOpening =
                platformNotificationPanel.style.display !==
                "block";


            platformNotificationPanel.style.display =
                isOpening ? "block" : "none";


            if (isOpening) {

                markPlatformNotificationsAsRead();

                loadPlatformNotifications();

            }

        }
    );


    document.addEventListener(
        "click",
        function () {

            platformNotificationPanel.style.display =
                "none";

        }
    );


    platformNotificationPanel.addEventListener(
        "click",
        function (e) {

            e.stopPropagation();

        }
    );

}


// =========================================================
// GET PLATFORM NOTIFICATIONS
// =========================================================


function getPlatformNotifications() {
    let notifications =
        JSON.parse(localStorage.getItem("notifications")) || [];

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) return [];

    const staffState =
        normalizeNotificationState(currentUser.state);

    return notifications.filter(notification => {

        if (notification.recipientType !== "platform") {
            return false;
        }

        if (
            !["departed", "incoming", "arrival"]
                .includes(notification.eventType)
        ) {
            return false;
        }

        if (currentUser.role === "admin") {
            return true;
        }

        if (currentUser.role === "staff") {
            return (
                normalizeNotificationState(
                    notification.state
                ) === staffState
            );
        }

        return false;
    });
}



// =========================================================
// LOAD PLATFORM NOTIFICATIONS
// =========================================================

function loadPlatformNotifications() {

    const list =
        document.getElementById(
            "platformNotificationList"
        );


    const count =
        document.getElementById(
            "platformNotificationCount"
        );


    if (!list || !count) return;


    const notifications =
        getPlatformNotifications();


    list.innerHTML = "";


    if (notifications.length === 0) {

        list.innerHTML =
            "<li>No bus movement notifications</li>";

        count.textContent = "0";

        return;

    }


    notifications.forEach(
        (notification, index) => {

            list.innerHTML += `

                <li class="notification-item">

                    <div>

                        <strong>
                            ${notification.message}
                        </strong>

                        <br>

                        <small>
                            ${notification.time}
                        </small>

                    </div>


                    <button
                        class="delete-notification"
                        onclick="deletePlatformNotification(${index})"
                    >

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </li>

            `;

        }
    );


    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );

    const staffState =
        currentUser?.role === "staff"
            ? normalizeNotificationState(currentUser.state)
            : "";

    const unread =
        notifications.filter(notification => {

            if (currentUser?.role === "staff") {

                return notification.readByState?.[staffState] !== true;

            }

            return notification.read === false;

        }).length;

    count.textContent = unread;
    // const unread =
    //     notifications.filter(
    //         notification =>
    //             notification.read === false
    //     ).length;


    // count.textContent = unread;

}


// =========================================================
// MARK PLATFORM NOTIFICATIONS AS READ
// =========================================================


function markPlatformNotificationsAsRead() {

    let notifications =
        JSON.parse(
            localStorage.getItem("notifications")
        ) || [];

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );

    if (!currentUser) return;

    const staffState =
        normalizeNotificationState(
            currentUser.state
        );

    notifications.forEach(notification => {

        if (
            notification.recipientType === "platform" &&
            [
                "departed",
                "incoming",
                "arrival"
            ].includes(notification.eventType)
        ) {

            // ADMIN
            if (currentUser.role === "admin") {

                notification.read = true;

            }

            // STAFF: keep read status separate by state
            else if (currentUser.role === "staff") {

                if (
                    normalizeNotificationState(
                        notification.state
                    ) === staffState
                ) {

                    if (!notification.readByState) {
                        notification.readByState = {};
                    }

                    notification.readByState[staffState] = true;

                }

            }

        }

    });

    localStorage.setItem(
        "notifications",
        JSON.stringify(notifications)
    );

}


// =========================================================
// DELETE PLATFORM NOTIFICATION
// =========================================================

function deletePlatformNotification(index) {

    let notifications =
        JSON.parse(
            localStorage.getItem("notifications")
        ) || [];


    const platformNotifications =
        getPlatformNotifications();


    const notificationToDelete =
        platformNotifications[index];


    if (!notificationToDelete) return;


    const realIndex =
        notifications.findIndex(
            notification =>
                notification.id ===
                notificationToDelete.id
        );


    if (realIndex === -1) return;


    notifications.splice(
        realIndex,
        1
    );


    localStorage.setItem(
        "notifications",
        JSON.stringify(notifications)
    );


    loadPlatformNotifications();

}


// =========================================================
// CLEAR PLATFORM NOTIFICATIONS ONLY
// =========================================================

function clearPlatformNotifications() {

    if (
        !confirm(
            "Are you sure you want to clear all bus movement notifications?"
        )
    ) {

        return;

    }


    let notifications =
        JSON.parse(
            localStorage.getItem("notifications")
        ) || [];


    notifications =
        notifications.filter(
            notification => {

                return !(
                    notification.recipientType ===
                    "platform" &&

                    [
                        "departed",
                        "incoming",
                        "arrival"
                    ].includes(
                        notification.eventType
                    )
                );

            }
        );


    localStorage.setItem(
        "notifications",
        JSON.stringify(notifications)
    );


    loadPlatformNotifications();

}


// =========================================================
// PLATFORM NOTIFICATION INITIALIZATION
// =========================================================

function initializePlatformNotifications() {

    const platformBtn =
        document.getElementById(
            "platformNotificationBtn"
        );


    const platformPanel =
        document.getElementById(
            "platformNotificationPanel"
        );


    if (
        !platformBtn ||
        !platformPanel
    ) {

        return;

    }


    loadPlatformNotifications();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializePlatformNotifications
    );

} else {

    initializePlatformNotifications();

}


// =========================================================
// KEEP PLATFORM COUNT UPDATED
// =========================================================

setInterval(
    function () {

        if (
            document.getElementById(
                "platformNotificationBtn"
            ) &&

            document.getElementById(
                "platformNotificationPanel"
            )
        ) {

            loadPlatformNotifications();

        }

    },
    5000
);










//PROFILE SECTION
document.addEventListener("DOMContentLoaded", () => {

    const profileForm = document.getElementById("profileForm");

    if (!profileForm) return;

    let currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    // Load user information
    document.getElementById("profileName").value =
        currentUser.fullName || "";

    document.getElementById("profileUsername").value =
        currentUser.username || "";

    document.getElementById("profileEmail").value =
        currentUser.email || "";

    document.getElementById("profileRole").value =
        currentUser.role || "";

    // Save profile changes
    profileForm.addEventListener("submit", function (e) {

        e.preventDefault();

        let currentUser =
            JSON.parse(localStorage.getItem("currentUser"));

        const oldUsername = currentUser.username;

        let users =
            JSON.parse(localStorage.getItem("users")) || [];

        // Update current user object
        currentUser.fullName =
            document.getElementById("profileName").value.trim();

        currentUser.username =
            document.getElementById("profileUsername").value.trim();

        currentUser.email =
            document.getElementById("profileEmail").value.trim();

        // Find the correct user using the old username
        const index = users.findIndex(user =>
            user.username === oldUsername
        );

        if (index !== -1) {

            users[index].fullName = currentUser.fullName;
            users[index].username = currentUser.username;
            users[index].email = currentUser.email;

            localStorage.setItem(
                "users",
                JSON.stringify(users)
            );
        }

        // Update current user
        localStorage.setItem(
            "currentUser",
            JSON.stringify(currentUser)
        );

        // Notification
        loadNotifyMessage("profile", {
            username: currentUser.username
        });

        alert("Profile updated successfully.");

    });

});


/* =========================================================
   SETTINGS MENU
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const settingsBtn =
        document.getElementById("settingsBtn");

    const settingsPanel =
        document.getElementById("settingsPanel");

    const darkModeBtn =
        document.getElementById("darkModeBtn");


    /* ==========================================
       SETTINGS OPEN / CLOSE
       ========================================== */

    if (settingsBtn && settingsPanel) {

        settingsBtn.addEventListener("click", function (e) {

            e.stopPropagation();

            settingsPanel.classList.toggle("show");

        });


        settingsPanel.addEventListener("click", function (e) {

            e.stopPropagation();

        });


        document.addEventListener("click", function () {

            settingsPanel.classList.remove("show");

        });

    }

});

/* =========================================================
   CARD PAYMENT FORM VALIDATION
   Prevent card payment until all required information
   has been completed.
========================================================= */

function validateCardPaymentFields() {

    const requiredFields = [
        {
            id: "passengerName",
            message: "Please enter the passenger name."
        },
        {
            id: "passengerPhone",
            message: "Please enter the passenger phone number."
        },
        {
            id: "passengerEmail",
            message: "Please enter the passenger email."
        },
        {
            id: "gender",
            message: "Please select the passenger's gender."
        },
        {
            id: "ticketType",
            message: "Please select the ticket type."
        },
        {
            id: "kidCount",
            message: "Please enter the number of kids."
        },
        {
            id: "sponsorName",
            message: "Please enter the sponsor name."
        },
        {
            id: "sponsorPhone",
            message: "Please enter the sponsor phone number."
        },
        {
            id: "sponsorEmail",
            message: "Please enter the sponsor email."
        },
        {
            id: "bookingState",
            message: "Please select the departure state."
        },
        {
            id: "bookingBusNumber",
            message: "Please select a bus."
        },
        {
            id: "bookingRoute",
            message: "Please select a route."
        },
        {
            id: "departureDate",
            message: "Please select a departure date."
        },
        {
            id: "departureTime",
            message: "Please select a departure time."
        },
        {
            id: "driverName",
            message: "Please select a valid trip with a driver."
        },
        {
            id: "busStatus",
            message: "Please select a valid trip."
        },
        {
            id: "ticketPrice",
            message: "Please select a valid trip so the ticket price can be calculated."
        },
        {
            id: "seatNumber",
            message: "Please select a seat."
        },
        {
            id: "paymentMethod",
            message: "Please select Card Payment."
        },

        /* CARD DETAILS */

        {
            id: "cardName",
            message: "Please enter the cardholder name."
        },
        {
            id: "cardNumber",
            message: "Please enter the card number."
        },
        {
            id: "cardExpiry",
            message: "Please enter the card expiry date."
        },
        {
            id: "cardCvv",
            message: "Please enter the CVV."
        }
    ];


    for (const field of requiredFields) {

        const input =
            document.getElementById(field.id);

        if (!input) {
            continue;
        }

        /*
         * Kid count already has a default value of 0,
         * so it is considered valid.
         */
        if (
            field.id === "kidCount" &&
            input.value !== ""
        ) {
            continue;
        }


        if (!String(input.value || "").trim()) {

            alert(field.message);

            input.focus();

            input.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            return false;
        }

    }


    /* =====================================================
       PHONE VALIDATION
    ===================================================== */

    const passengerPhone =
        document.getElementById("passengerPhone");

    if (
        passengerPhone &&
        passengerPhone.value.trim().length < 11
    ) {

        alert(
            "Passenger phone number must contain at least 11 characters."
        );

        passengerPhone.focus();

        passengerPhone.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        return false;
    }


    const sponsorPhone =
        document.getElementById("sponsorPhone");

    if (
        sponsorPhone &&
        sponsorPhone.value.trim().length < 11
    ) {

        alert(
            "Sponsor phone number must contain at least 11 characters."
        );

        sponsorPhone.focus();

        sponsorPhone.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        return false;
    }


    /* =====================================================
       CARD NUMBER VALIDATION
    ===================================================== */

    const cardNumber =
        document.getElementById("cardNumber");

    if (cardNumber) {

        const cleanCardNumber =
            cardNumber.value.replace(/\s/g, "");

        if (cleanCardNumber.length < 12) {

            alert(
                "Please enter a valid card number."
            );

            cardNumber.focus();

            cardNumber.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            return false;
        }
    }


    /* =====================================================
       EXPIRY DATE VALIDATION
    ===================================================== */

    const cardExpiry =
        document.getElementById("cardExpiry");

    if (cardExpiry) {

        const expiryPattern =
            /^(0[1-9]|1[0-2])\/\d{2}$/;

        if (!expiryPattern.test(cardExpiry.value.trim())) {

            alert(
                "Please enter the card expiry date in MM/YY format."
            );

            cardExpiry.focus();

            cardExpiry.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            return false;
        }
    }


    /* =====================================================
       CVV VALIDATION
    ===================================================== */

    const cardCvv =
        document.getElementById("cardCvv");

    if (cardCvv) {

        if (!/^\d{3,4}$/.test(cardCvv.value.trim())) {

            alert(
                "Please enter a valid 3 or 4 digit CVV."
            );

            cardCvv.focus();

            cardCvv.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            return false;
        }
    }


    return true;
}




/* =========================================================
   PAYMENT METHOD DISPLAY
   Works on Passenger and Manager Booking Pages
   ========================================================= */

function setupPaymentMethod() {

    const paymentMethod =
        document.getElementById("paymentMethod");

    if (!paymentMethod) return;


    const cashBox =
        document.getElementById("cashPaymentBox");

    const transferBox =
        document.getElementById("transferPaymentBox");

    const cardBox =
        document.getElementById("cardPaymentBox");


    const transferReference =
        document.getElementById("transferReference");

    const cardName =
        document.getElementById("cardName");

    const cardNumber =
        document.getElementById("cardNumber");

    const cardExpiry =
        document.getElementById("cardExpiry");

    const cardCvv =
        document.getElementById("cardCvv");


    /* =====================================================
       HIDE ALL PAYMENT BOXES
       ===================================================== */

    function hidePaymentBoxes() {

        if (cashBox) {
            cashBox.style.display = "none";
        }

        if (transferBox) {
            transferBox.style.display = "none";
        }

        if (cardBox) {
            cardBox.style.display = "none";
        }

    }


    /* =====================================================
       UPDATE PAYMENT AMOUNT
       ===================================================== */

    function updatePaymentAmount() {

        const ticketPrice =
            document.getElementById("ticketPrice");

        let amount = 0;


        if (ticketPrice) {

            amount =
                Number(
                    String(ticketPrice.value)
                        .replace(/[₦,\s]/g, "")
                        .trim()
                ) || 0;

        }


        const formattedAmount =
            "₦" + amount.toLocaleString();


        const cashAmount =
            document.getElementById("cashAmount");

        const transferAmount =
            document.getElementById("transferAmount");

        const cardAmount =
            document.getElementById("cardAmount");


        if (cashAmount) {
            cashAmount.textContent =
                formattedAmount;
        }

        if (transferAmount) {
            transferAmount.textContent =
                formattedAmount;
        }

        if (cardAmount) {
            cardAmount.textContent =
                formattedAmount;
        }

    }


    /* =====================================================
       UPDATE REQUIRED FIELDS
       ===================================================== */

    function updatePaymentRequirements() {

        const method =
            paymentMethod.value;


        // Transfer reference
        if (transferReference) {

            transferReference.required =
                method === "Transfer";

        }


        // Cardholder name
        if (cardName) {

            cardName.required =
                method === "Card";

        }


        // Card number
        if (cardNumber) {

            cardNumber.required =
                method === "Card";

        }


        // Card expiry
        if (cardExpiry) {

            cardExpiry.required =
                method === "Card";

        }


        // Card CVV
        if (cardCvv) {

            cardCvv.required =
                method === "Card";

        }

    }


    /* =====================================================
       SHOW SELECTED PAYMENT METHOD
       ===================================================== */

    function showSelectedPayment() {

        hidePaymentBoxes();

        updatePaymentAmount();

        updatePaymentRequirements();


        switch (paymentMethod.value) {

            case "Cash":

                if (cashBox) {

                    cashBox.style.display =
                        "block";

                }

                break;


            case "Transfer":

                if (transferBox) {

                    transferBox.style.display =
                        "block";

                }

                break;


            case "Card":

                if (cardBox) {

                    cardBox.style.display =
                        "block";

                }

                break;


            default:

                hidePaymentBoxes();

        }

    }


    /* =====================================================
       PAYMENT METHOD CHANGE
       ===================================================== */

    paymentMethod.addEventListener(
        "change",
        showSelectedPayment
    );


    /* =====================================================
       UPDATE AMOUNT WHEN TICKET PRICE CHANGES
       ===================================================== */

    const ticketPrice =
        document.getElementById("ticketPrice");


    if (ticketPrice) {

        ticketPrice.addEventListener(
            "input",
            updatePaymentAmount
        );

        ticketPrice.addEventListener(
            "change",
            updatePaymentAmount
        );

    }


    /* =====================================================
       RUN WHEN PAGE LOADS
       ===================================================== */

    showSelectedPayment();

}

/* =========================================================
   CARD PAYMENT BUTTON
   Frontend preparation for payment gateway
   ========================================================= */

let cardPaymentSuccessful = false;
let cardTransactionReference = "";

/* =========================================================
   CARD PAYMENT BUTTON
   Professional confirmation popup
   ========================================================= */

function setupCardPaymentButton() {

    const payWithCardBtn =
        document.getElementById("payWithCardBtn");

    const paymentMethod =
        document.getElementById("paymentMethod");

    const ticketPrice =
        document.getElementById("ticketPrice");

    const cardPaymentMessage =
        document.getElementById("cardPaymentMessage");

    if (!payWithCardBtn || !paymentMethod) {
        return;
    }

    payWithCardBtn.addEventListener("click", function () {

        if (!validateCardPaymentFields()) {
            return;
        }

        /* -----------------------------------------
           CHECK PAYMENT METHOD
           ----------------------------------------- */

        if (paymentMethod.value !== "Card") {
            alert("Please select Card Payment first.");
            return;
        }

        /* -----------------------------------------
           GET TICKET AMOUNT
           ----------------------------------------- */

        const amount =
            Number(
                String(ticketPrice?.value || "")
                    .replace(/[₦,]/g, "")
                    .trim()
            ) || 0;

        if (amount <= 0) {
            alert(
                "Please select a valid bus and route so the ticket price can be calculated."
            );
            return;
        }

        /* -----------------------------------------
           GET CARD CONFIRMATION POPUP
           ----------------------------------------- */

        const popup =
            document.getElementById("cardConfirmPopup");

        const message =
            document.getElementById("cardConfirmMessage");

        const yesButton =
            document.getElementById("confirmCardYes");

        const noButton =
            document.getElementById("confirmCardNo");

        if (!popup || !message || !yesButton || !noButton) {
            alert("Card confirmation popup not found.");
            return;
        }

        /* -----------------------------------------
           DISPLAY CONFIRMATION MESSAGE
           ----------------------------------------- */

        message.innerHTML =
            "Proceed with card payment of " +
            "<strong>₦" +
            amount.toLocaleString() +
            "</strong>?";

        /* -----------------------------------------
           SHOW POPUP
           ----------------------------------------- */

        popup.style.display = "flex";

        /* -----------------------------------------
           YES, PAY
           ----------------------------------------- */

        yesButton.onclick = function () {

            popup.style.display = "none";

            /* -------------------------------------
               TEST CARD PAYMENT SUCCESS
               Later replaced by Paystack/
               Flutterwave gateway response.
               ------------------------------------- */

            cardPaymentSuccessful = true;

            cardTransactionReference =
                "CARD-TEST-" + Date.now();

            /* -------------------------------------
               DISPLAY PAYMENT MESSAGE
               ------------------------------------- */

            if (cardPaymentMessage) {

                cardPaymentMessage.innerHTML = `
                    <i class="fa-solid fa-circle-check"></i>
                    Card payment successful.
                    Transaction Reference:
                    <strong>${cardTransactionReference}</strong>
                `;

                cardPaymentMessage.classList.remove(
                    "pending"
                );

                cardPaymentMessage.classList.add(
                    "verification"
                );
            }

            /* -------------------------------------
               SHOW PAYMENT SUCCESS POPUP
               ------------------------------------- */

            const successPopup =
                document.getElementById(
                    "paymentSuccessPopup"
                );

            const successMessage =
                document.getElementById(
                    "paymentSuccessMessage"
                );

            if (successPopup && successMessage) {

                successMessage.innerHTML =
                    "Card payment completed successfully.<br><br>" +

                    "<strong>Amount Paid:</strong> ₦" +
                    amount.toLocaleString() +
                    "<br>" +

                    "<strong>Transaction Reference:</strong> " +
                    cardTransactionReference;

                successPopup.style.display = "flex";
            }

        };

        /* -----------------------------------------
           NO, CANCEL
           ----------------------------------------- */

        noButton.onclick = function () {

            popup.style.display = "none";

        };

    });
}


/* =========================================================
   INITIALIZE CARD PAYMENT BUTTON
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    setupCardPaymentButton();
});

/* =========================================================
   CARD PAYMENT SUCCESS HANDLER
   Backend-ready frontend function
   ========================================================= */

function handleCardPaymentSuccess(bookingId, transactionReference) {

    let bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    const bookingIndex = bookings.findIndex(
        booking => booking.bookingId === bookingId
    );

    if (bookingIndex === -1) {
        alert("Booking not found.");
        return;
    }

    const booking = bookings[bookingIndex];

    // Prevent processing the same payment twice
    if (booking.paymentStatus === "Paid") {
        alert("This payment has already been processed.");
        return;
    }

    // Update payment information
    booking.paymentStatus = "Paid";

    booking.transactionReference =
        transactionReference || "";

    // Generate receipt only after successful payment
    if (
        !booking.receiptNumber ||
        booking.receiptNumber === "null"
    ) {
        booking.receiptNumber =
            generateReceiptNumber();
    }

    // Update revenue only after successful payment
    let totalRevenue =
        Number(localStorage.getItem("totalRevenue")) || 0;

    totalRevenue += Number(booking.ticketPrice) || 0;

    localStorage.setItem(
        "totalRevenue",
        totalRevenue
    );

    // Save updated booking
    bookings[bookingIndex] = booking;

    localStorage.setItem(
        "bookings",
        JSON.stringify(bookings)
    );

    // Notification
    if (typeof loadNotifyMessage === "function") {
        loadNotifyMessage("payment", {
            passengerName: booking.passengerName,
            amount: booking.ticketPrice
        });
    }

    // Refresh page data
    if (typeof loadBookings === "function") {
        loadBookings();
    }

    if (typeof refreshDashboard === "function") {
        refreshDashboard();
    }

    if (typeof loadDashboardStats === "function") {
        loadDashboardStats();
    }

    alert(
        "Card payment successful.\n\n" +
        "Receipt No: " +
        booking.receiptNumber
    );
}


/* =========================================================
   INITIALIZE PAYMENT SYSTEM
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    setupPaymentMethod
);