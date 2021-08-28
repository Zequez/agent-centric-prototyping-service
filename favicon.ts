export default {
  status: 200,
  headers: new Headers({
    "content-type": "image/svg+xml",
  }),
  body: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50"/></svg>`,
};
