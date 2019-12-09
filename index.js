let pagination = '';
let isShowStreams = false;
const input = document.querySelector('input');
const inputBtn = document.querySelector('.search_btn');
const nav = document.querySelector('.navbar__nav');
const datalist = document.querySelector('#gameNames');
const clientId = 's16ay4uu63zxeyd938j2zhld42wmx0';
let gameInfo = {};
let index = 0;
let streamsData = [];
let scrollEvent;

const reset = () => {
  index = 0;
  pagination = '';
  gameInfo = {};
  streamsData = [];
};

const gameInfoCreator = (res) => {
  gameInfo.id = res.id;
  gameInfo.name = res.name;
};

const getGameId = (gameName) => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest();
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      const json = JSON.parse(request.responseText);
      resolve(json.data[0]);
    } else {
      reject(this.status);
    }
    request.onerror = () => console.log('error');
  };
  request.open('GET', `https://api.twitch.tv/helix/games?name=${encodeURI(gameName)}`);
  request.setRequestHeader('Client-ID', 's16ay4uu63zxeyd938j2zhld42wmx0');
  request.send();
});

const changeLiBg = () => {
  const li = nav.querySelectorAll('li');
  li.forEach((el) => {
    if (el.innerText === gameInfo.name) el.classList.add('selected');
    else el.classList.remove('selected');
  });
};

const showStreams = (user) => {
  input.value = '';
  const container = document.querySelector('.display_streams');
  if (index === 0) {
    container.innerHTML = streamsData.length === 0 ? '<h3>現在沒有任何直播</h3>' : '';
    document.querySelector('.game_name').innerHTML = gameInfo.name;
    changeLiBg();
  }

  streamsData.map((item, i) => {
    const a = document.createElement('a');
    const tumbnailUrl = item.thumbnail_url.replace('{width}x{height}', '272x153');
    a.classList.add('each_stream');
    a.href = `https://www.twitch.tv/${user[i].login}`;
    a.target = '_blank';
    a.innerHTML = `<img class="each_stream__preview" src=${tumbnailUrl}>
    <div class="profile">
    <img class="profile__logo" src="${user[i].profile_image_url}">
    <div class="profile__info">
        <div class="profile__status">${item.title}</div>
        <div class="profile__display_name">${item.user_name}</div>
      </div>
    </div>`;
    container.appendChild(a);
    return null;
  });

  index += streamsData.length;
  isShowStreams = true;
};

const getUsersImage = () => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    let url = `https://api.twitch.tv/helix/users?id=${streamsData[0].user_id}`;
    for (let i = 1; i < streamsData.length; i++) {
      url += `&id=${streamsData[i].user_id}`;
    }
    request.open('GET', url);
    request.setRequestHeader('Client-ID', clientId);
    request.onload = () => {
      if (request.status >= 200 && request.status < 400) {
        const user = JSON.parse(request.responseText);
        resolve(user.data);
      } else {
        reject(request);
      }
      request.onerror = () => console.log('error');
    };
    request.send();
  });
};

const getStreamsByGameID = id => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest();
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      const json = JSON.parse(request.responseText);
      resolve(json);
    } else reject(request);
    request.onerror = () => console.log('error');
  };
  request.open('GET', `https://api.twitch.tv/helix/streams?game_id=${id}&limit=20&after=${pagination}`);
  request.setRequestHeader('Client-ID', 's16ay4uu63zxeyd938j2zhld42wmx0');
  request.send();
});

function getFirst20Streams(gameName) {
  getGameId(gameName).then((res) => {
    reset();
    gameInfoCreator(res);
    window.addEventListener('scroll', scrollEvent);
    return getStreamsByGameID(res.id);
  }).then((res) => {
    pagination = res.pagination.cursor;
    streamsData = res.data;
    if (streamsData.length < 20) window.removeEventListener('scroll', scrollEvent);
    return streamsData.length === 0 ? null : getUsersImage();
  }).then((res) => {
    showStreams(res);
  });
}

function getOther20Streams() {
  getStreamsByGameID(gameInfo.id).then((res) => {
    pagination = res.pagination.cursor;
    streamsData = res.data;
    if (streamsData.length < 20) window.removeEventListener('scroll', scrollEvent);
    return getUsersImage(res.data);
  }).then((res) => {
    showStreams(res);
  });
}

// https://blog.csdn.net/IT_DREAM_ER/article/details/53513017
scrollEvent = () => {
  if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 60 && isShowStreams) {
    // 不然 streams 還沒新增完前也會觸發
    isShowStreams = false;
    getOther20Streams();
  }
};

const pushGamesToDatalist = (games) => {
  datalist.innerHTML = '';
  games.map((game) => {
    const option = document.createElement('option');
    option.value = game.name;
    datalist.appendChild(option);
    return null;
  });
};

const searchGames = name => new Promise((resolve, reject) => {
  let result = [];
  const request = new XMLHttpRequest();
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      const json = JSON.parse(request.responseText);
      result = json.games;
      resolve(result);
    } else reject(request);
    request.onerror = () => console.log('error');
  };
  request.open('GET', `https://api.twitch.tv/kraken/search/games?query=${name}`);
  request.setRequestHeader('Client-ID', 's16ay4uu63zxeyd938j2zhld42wmx0');
  request.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
  request.send();
});

async function searchGameResult() {
  const result = await searchGames(input.value);
  if (result) pushGamesToDatalist(result);
  if (result && result.length === 1) input.value = result[0].name;
  return result;
}

const startChangeGame = (e, result) => {
  if (e.keyCode === 13 || e.type === 'click') {
    if (!result) return alert('no such game');
    getFirst20Streams(input.value);
  }
  return null;
};

const load = () => {
  getFirst20Streams('League of Legends');
};

nav.addEventListener('click',
  (e) => {
    if (e.target.nodeName === 'LI') {
      getFirst20Streams(e.target.innerText);
    }
  });

input.addEventListener('keyup',
  (e) => {
    if (input.value.length > 2) {
      startChangeGame(e, searchGameResult());
    }
  });

inputBtn.addEventListener('click',
  (e) => {
    if (input.value) {
      startChangeGame(e, searchGameResult());
    }
  });

load();

// 手動偵測 WebP
// https://medium.com/@mingjunlu/image-optimization-using-webp-72d5641213c9
// webp-detect.js
window.addEventListener('DOMContentLoaded', async () => {
  const detectWebp = () => new Promise((resolve) => {
    const imgSrc = 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA';
    const pixel = new Image();
    pixel.addEventListener('load', () => {
      const isSuccess = (pixel.width > 0) && (pixel.height > 0);
      resolve(isSuccess);
    });
    pixel.addEventListener('error', () => { resolve(false); });
    pixel.setAttribute('src', imgSrc); // 開始載入測試圖
  });

  const hasSupport = await detectWebp();
  document.querySelector('body').classList.add(hasSupport ? 'webp' : 'no-webp');
});
