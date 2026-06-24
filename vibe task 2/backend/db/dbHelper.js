const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'users.json');
const POSTS_PATH = path.join(__dirname, 'posts.json');
const COMMENTS_PATH = path.join(__dirname, 'comments.json');
const FOLLOWERS_PATH = path.join(__dirname, 'followers.json');

const readData = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf8');
      return [];
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

const writeData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
};

module.exports = {
  getUsers: () => readData(USERS_PATH),
  saveUsers: (data) => writeData(USERS_PATH, data),
  getPosts: () => readData(POSTS_PATH),
  savePosts: (data) => writeData(POSTS_PATH, data),
  getComments: () => readData(COMMENTS_PATH),
  saveComments: (data) => writeData(COMMENTS_PATH, data),
  getFollowers: () => readData(FOLLOWERS_PATH),
  saveFollowers: (data) => writeData(FOLLOWERS_PATH, data)
};
