const production = {
  "api_url": "http://localhost:4000/",
  "mediaPath": "/home/ubuntu/dobot_backend/uploads/",
  "db": {
    "host": "localhost",
    "user": "root",
    "password": "dobot@2020",
    "database": "bot",
    "charset" : "utf8mb4"
  },
  "webhook": {
    "url": "https://dobot.uz",
    "path": "/webhook/"
  }
}

const development = {
  "api_url": "http://localhost:4000/",
  "mediaPath": "/home/ubuntu/dobot_backend/uploads/",
  "db": {
    "host": "localhost",
    "user": "root",
    "password": "dobot@2020",
    "database": "bot",
    "charset" : "utf8mb4"
  },
  "webhook": {
    "url": "https://dobot.uz",
    "path": "/webhook/"
  }
}

module.exports = process.env.NODE_ENV === 'production' ? production : development;