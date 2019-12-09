// eslint 'no-underscore-dangle':  ['error', { 'allow': ['_total'] }]
let pagination = '';
let paginationForTopGames = '';
const gamesName = [];
let isShowStreams = false;
const input = document.querySelector('input');
const inputBtn = document.querySelector('.search_btn');
const nav = document.querySelector('.navbar__nav');
const loadMoreBtn = document.querySelector('.more_streams__btn');
const clientId = 's16ay4uu63zxeyd938j2zhld42wmx0';
let gameInfo = {};
let index = 0;
const reset = () => {
  index = 0;
  pagination = '';
  gameInfo = {};
};

function getGameId(gameName) {
  return new Promise((resolve, reject) => {
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
}

const changeLiBg = () => {
  const li = nav.querySelectorAll('li');
  li.forEach((el) => {
    if (el.innerText === gameInfo.name) el.classList.add('selected');
    else el.classList.remove('selected');
  });
};
// 現在的總 streams 數在新的 API 沒有了
// const isStreamsEnd = (offset, totalStreams) => {
//   if (offset >= totalStreams) loadMoreBtn.classList.add('more_streams__btn__hidden');
//   else loadMoreBtn.classList.remove('more_streams__btn__hidden');
// };

const showStreams = (data, user) => {
  input.value = '';
  const container = document.querySelector('.display_streams');
  if (data.length === 0) return false;
  if (index === 0) {
    container.innerHTML = '';
    document.querySelector('.game_name').innerHTML = gameInfo.name;
    changeLiBg('League of Legends');
  }
  for (let i = 0; i < data.length; i++) {
    const a = document.createElement('a');
    const tumbnailUrl = data[i].thumbnail_url.replace('{width}x{height}', '272x153');
    a.classList.add('each_stream');
    a.href = `https://www.twitch.tv/${user[i].login}`;
    a.target = '_blank';
    a.innerHTML = `<img class="each_stream__preview" src=${tumbnailUrl}>
    <div class="profile">
    <img class="profile__logo" src="${user[i].profile_image_url}">
    <div class="profile__info">
        <div class="profile__status">${data[i].title}</div>
        <div class="profile__display_name">${data[i].user_name}</div>
      </div>
    </div>`;
    container.appendChild(a);
  }
  index += data.length;
  // isStreamsEnd(index, totalStreams);
  isShowStreams = true;
  return true;
};

const getUsersImage = (data) => {
  const request = new XMLHttpRequest();
  let url = `https://api.twitch.tv/helix/users?id=${data[0].user_id}`;
  for (let i = 1; i < data.length; i++) {
    url += `&id=${data[i].user_id}`;
  }

  request.open('GET', url);
  request.setRequestHeader('Client-ID', clientId);
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      const user = JSON.parse(request.responseText);
      showStreams(data, user.data);
    } else console.log('err', request.status, request.responseText);
    request.onerror = () => console.log('error');
  };
  request.send();
};

async function getStreams(gameName) {
  if (!gameInfo.id)gameInfo = await getGameId(gameName);
  const request = new XMLHttpRequest();
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      const json = JSON.parse(request.responseText);
      // console.log(json);
      // const data = json.data;
      pagination = json.pagination.cursor;
      getUsersImage(json.data);
    } else console.log('err', request.status, request.responseText);
    request.onerror = () => console.log('error');
  };
  request.open('GET', `https://api.twitch.tv/helix/streams?game_id=${gameInfo.id}&limit=20&after=${pagination}`);
  request.setRequestHeader('Client-ID', 's16ay4uu63zxeyd938j2zhld42wmx0');
  request.send();
}

const get100GamesName = () => {
  const request = new XMLHttpRequest();
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      const json = JSON.parse(request.responseText);
      console.log('100g', json);
      paginationForTopGames = json.pagination.cursor;
      json.data.forEach((el) => { gamesName.push(el.name); });
    } else console.log('err', request.status, request.responseText);
    request.onerror = () => console.log('error');
  };
  request.open('GET', `https://api.twitch.tv/helix/games/top?first=100&after=${paginationForTopGames}`);
  request.setRequestHeader('Client-ID', 's16ay4uu63zxeyd938j2zhld42wmx0');
  request.send();
};

const getAllGamesName = (totalNum) => {
  for (let i = 0; i < totalNum / 100; i++) get100GamesName();
};
// 使用新的 API 後 因為使用 pagination 不能像原本只接用 FOR 迴圈了 要看 WEEK3 的 作業

// total = 2020 games

const search = (str, data) => {
  const word = str.toLowerCase();
  const result = [];
  data.forEach((el) => {
    if (el.slice(0, word.length).toLowerCase() === word) result.push(el);
  });
  return result;
};

const checkInputStatus = (text) => {
  const result = search(text, gamesName);
  if (result.length === 1) return true;
  if (result.length === 0) alert('No such game');
  else alert(`Maybe:\n ${result}`);
  return false;
};

const load = (totalNum, callback) => {
  getStreams('League of Legends', '');
  nav.children[0].classList.add('selected');
  callback(totalNum);
};
// 要用 callback 不然剛載入網頁時 Streams 圖片顯示得很慢

// https://blog.csdn.net/IT_DREAM_ER/article/details/53513017
const scrollEvent = () => {
  if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 30 && isShowStreams) {
    // 不然 streams 還沒新增完前也會觸發
    isShowStreams = false;
    // getStreams(document.querySelector('.game_name').innerText);
    getStreams("document.querySelector('.game_name').innerText");
  }
};

nav.addEventListener('click',
  (e) => {
    if (e.target.nodeName === 'LI') {
      changeLiBg(e.target.innerText);
      index = 0;
      reset();
      getStreams(e.target.innerText);
    }
  });

loadMoreBtn.addEventListener('click', () => {
  getStreams(document.querySelector('.game_name').innerText);
});

input.addEventListener('keyup',
  (e) => {
    if (input.value.length > 2) {
      const result = search(input.value, gamesName);
      if (result.length === 1) input.value = [...result];
      if (e.keyCode === 13 && checkInputStatus(input.value)) {
        reset();
        getStreams(input.value);
      }
    }
  });

inputBtn.addEventListener('click',
  () => {
    if (input.value && checkInputStatus(input.value)) {
      reset();
      getStreams(input.value);
    }
  });

window.addEventListener('scroll', scrollEvent);

load(100, getAllGamesName);
