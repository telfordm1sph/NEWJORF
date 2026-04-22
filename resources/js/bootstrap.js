import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "axios";

// Axios setup
window.axios = axios;
window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

// Pusher setup with FULL debug logging
window.Pusher = Pusher;
Pusher.logToConsole = true;

// Echo configuration for SSL
window.echo = new Echo({
    broadcaster: "pusher",
    key: "e9b3f1a7c6d8b2f0a3d5c7e1f0a9b2c4",
    cluster: "mt1", // ← required even when using wsHost
    wsHost: "192.168.2.221",
    wsPort: 6003,
    wssPort: 6003,
    forceTLS: false,
    disableStats: true, // ← add this to stop Pusher phoning home
    enabledTransports: ["ws"],
    authEndpoint: "http://192.168.2.221:8191/JORF/broadcasting/auth",
    auth: {
        headers: {
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')
                ?.content,
            Accept: "application/json",
        },
        withCredentials: true,
    },
});

// Test connection
window.echo.connector.pusher.connection.bind("connected", () => {
    console.log("✅ Connected to Soketi WebSocket server!");
});

window.echo.connector.pusher.connection.bind("error", (err) => {
    console.error("❌ WebSocket connection error:", err);
});
