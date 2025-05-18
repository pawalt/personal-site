$(() => {
  if (window.location.pathname.startsWith("/posts") || window.location.pathname.startsWith("/recipes")) {
    startKudos();
  }
})

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function startKudos() {
  var uuid = localStorage.getItem('clientId');
  if (uuid == null) {
    uuid = uuidv4();
    localStorage.setItem('clientId', uuid);
  }

  const postName = window.location.pathname
    .split("/")
    .filter(function (c) { return c.length; })
    .pop();

  const ring = $('#kudosRing');
  const circle = $('#kudosCircle');
  const text = $('#kudosText');
  const kudosInterval = 1 * 1000;
  let lastTime = 0;

  const initResp = kudosCheck(uuid, postName);

  // if check fails this will be undefined
  if (!initResp.numClicked) {
    initResp.numClicked = 0;
  }
  text.text(initResp.numClicked + " kudos");

  if (!initResp.userClicked) {
    circle.mouseenter(e => {
      lastTime = (new Date()).getTime();
      setTimeout(() => {
        const now = (new Date()).getTime();
        if (lastTime != 0 && now - lastTime >= kudosInterval) {
          circle.removeClass("empty");
          circle.addClass("filled");
          ring.removeClass("empty");
          ring.addClass("filled");
          circle.unbind("mouseenter");
          circle.unbind("mouseleave");
          text.text((initResp.numClicked + 1) + " kudos")
          addKudos(uuid, postName);
        }
      }, kudosInterval);
    });
    circle.mouseleave(e => {
      lastTime = 0;
    });
  } else {
    circle.removeClass("empty");
    circle.addClass("filled");
    ring.removeClass("empty");
    ring.addClass("filled");
  }
}

function addKudos(uuid, postName) {
  const response = $.ajax({
    url: "/.netlify/functions/add-kudos",
    method: "GET",
    data: {
      post: postName,
      user: uuid
    },
    mimeType: 'application/json; charset=utf-8',
    async: false
  });
}

function kudosCheck(uuid, postName) {
  const response = $.ajax({
    url: "/.netlify/functions/get-kudos",
    method: "GET",
    data: {
      post: postName,
      user: uuid
    },
    mimeType: 'application/json; charset=utf-8',
    async: false
  });
  return JSON.parse(response.responseText);
}

