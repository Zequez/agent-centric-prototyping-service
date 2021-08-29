export default () => {
  const socket = new WebSocket("ws://localhost:8080");

  socket.addEventListener("open", function () {
    console.log("Listening to DEV server changes for reloading");
  });

  // Listen for messages
  socket.addEventListener("message", function (event) {
    console.log("Message from server ", event.data);
    if (event.data === "change") {
      document.location.reload();
    }
  });
};
