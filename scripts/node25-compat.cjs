// See node25-compat.mjs.  A CommonJS preload is used because Node applies it
// to the tsx loader worker as well as to the main process.
const os = require("node:os");
os.userInfo = () => ({
  uid: -1,
  gid: -1,
  username: process.env.USERNAME || process.env.USER || "node",
  homedir: process.env.USERPROFILE || process.cwd(),
  shell: null,
});
