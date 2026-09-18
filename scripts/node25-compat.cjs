// Node 25 can throw ENOMEM from os.userInfo() in tsx's temporary-directory
// helper on some Windows installations. A CommonJS preload is used because Node applies it
// to the tsx loader worker as well as to the main process.
const os = require("node:os");
os.userInfo = () => ({
  uid: -1,
  gid: -1,
  username: process.env.USERNAME || process.env.USER || "node",
  homedir: process.env.USERPROFILE || process.cwd(),
  shell: null,
});
