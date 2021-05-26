let pagination = '';
let isShowStreams = false;
const input = document.querySelector('input');
const inputBtn = document.querySelector('.search_btn');
const nav = document.querySelector('.navbar__nav');
const datalist = document.querySelector('#gameNames');
const clientId = '74mnqdsp7z6kg6if4t2i1kzvuil1hv';
const oauth = 'Bearer 3xuxtz569rtf5ixyrz27kbjhf84ojx';
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
// 更改目前顯示遊戲資訊
const gameInfoCreator = (res) => {
  gameInfo.id = res.id;
  gameInfo.name = res.name;
};
// 更改目錄背景顏色
const changeLiBg = () => {
  const li = nav.querySelectorAll('li');
  li.forEach((el) => {
    if (el.innerText === gameInfo.name) el.classList.add('selected');
    else el.classList.remove('selected');
  });
};
// 顯示直播
// 第一次顯示要修改標題的遊戲名稱
const showStreams = (user) => {
  input.value = '';
  const container = document.querySelector('.display_streams');
  if (index === 0) {
    container.innerHTML = streamsData.length === 0 ? '<h3>現在沒有任何直播</h3>' : '';
    document.querySelector('.game_name').innerHTML = gameInfo.name;
    changeLiBg();
  }

  streamsData.forEach((item, i) => {
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
  });

  index += streamsData.length;
  isShowStreams = true;
};

const getUsersImage = () => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest();
  let url = `https://api.twitch.tv/helix/users?id=${streamsData[0].user_id}`;
  for (let i = 1; i < streamsData.length; i++) {
    url += `&id=${streamsData[i].user_id}`;
  }
  request.open('GET', url);
  request.setRequestHeader('Client-ID', clientId);
  request.setRequestHeader('Authorization', oauth);
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

// Get Streams
// https://dev.twitch.tv/docs/api/reference#get-streams
// 從 pagination 索引後，拿到該遊戲 20 個直播
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
  request.setRequestHeader('Client-ID', clientId);
  request.setRequestHeader('Authorization', oauth);
  request.send();
});
// 得到前 20 熱門直播，並顯示 Streams
function getFirst20StreamsWithId({ id, name}) {
  reset();
  gameInfoCreator({ id, name });
  window.addEventListener('scroll', scrollEvent);
  getStreamsByGameID(id)
    .then((res) => {
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
  games.forEach((game) => {
    const option = document.createElement('option');
    option.value = game.name;
    datalist.appendChild(option);
  });
};
// Twitch API v5 (舊版)
// Search Games
// https://dev.twitch.tv/docs/v5/reference/search
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
  request.setRequestHeader('Client-ID', clientId);
  request.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
  request.send();
});
// 執行搜尋功能
// 顯示包含該字元遊戲目錄
// 如果目錄長度為一，搜尋欄自動填入該遊戲名稱
async function searchGameResult() {
  const result = await searchGames(input.value);
  if (result) pushGamesToDatalist(result);
  if (result && result.length === 1) input.value = result[0].name;
  return result;
}

// 按下 enter 或搜尋按鈕 ，如果找不到該遊戲跳出警告視窗
const startChangeGame = (e, result) => {
  if (e.keyCode === 13 || e.type === 'click') {
    if (!result) return alert('no such game');
    const findGame = result.find(item => item.name.toLowerCase() === input.value.toLowerCase());
    if (!findGame) return alert('no such game');
    getFirst20StreamsWithId({ id: findGame._id, name: findGame.name });
  }
  return null;
};
// Get Top Game
// https://dev.twitch.tv/docs/api/reference#get-top-games
// 拿到最熱門的 5 個遊戲更新至導覽列，回傳第一名的遊戲
const changeTop5GamesTab = () => new Promise((resolve, reject) => {
  fetch('https://api.twitch.tv/helix/games/top?first=6', {
    headers: {
      'Client-ID': clientId,
      'Authorization': oauth,
    },
  }).then(res => res.json())
    .then(({ data }) => {
      const lis = document.querySelectorAll('.navbar__nav li');
      // eslint-disable-next-line no-param-reassign
      lis.forEach((li, i) => {
        li.innerText = data[i].name;
        li.id = data[i].id;
      });
      resolve(data[0]);
    }).catch(err => reject(err));
});
// 拿到前五熱門遊戲後，顯示第一名遊戲前 20 熱門的直播
const load = () => {
  changeTop5GamesTab()
    .then(({ id, name }) => getFirst20StreamsWithId({ id, name }))
    .catch(() => getFirst20Streams('League of Legends'));
};
// 如果是點擊nav 前五熱門遊戲之一，顯示前 20 熱門的直播
nav.addEventListener('click',
  (e) => {
    if (e.target.nodeName === 'LI') {
      getFirst20StreamsWithId( { id: e.target.id, name: e.target.innerText });
    }
  });
// 在搜尋欄中字元長度大於 2 時執行搜尋遊戲功能
input.addEventListener('keyup',
  (e) => {
    if (input.value.length > 2) {
      searchGameResult().then((res) => {
        startChangeGame(e, res);
      });
    }
  });
// 搜尋按鈕被點擊且搜尋欄有文字執行搜尋遊戲功能
inputBtn.addEventListener('click',
  (e) => {
    if (input.value) {
      searchGameResult().then((res) => {
        startChangeGame(e, res);
      });
    }
  });

load();
