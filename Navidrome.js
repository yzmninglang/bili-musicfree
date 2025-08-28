"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const CryptoJs = require("crypto-js");
const pageSize = 25;
async function httpGet(urlPath, params) {
    var _a;
    const userVariables = (_a = env === null || env === void 0 ? void 0 : env.getUserVariables()) !== null && _a !== void 0 ? _a : {};
    let { url, username, password } = userVariables;
    console.log(userVariables);
    if (!(url && username && password)) {
        return null;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `http://${url}`;
    }
    const salt = Math.random().toString(16).slice(2);
    const preParams = {
        u: username,
        s: salt,
        t: CryptoJs.MD5(`${password}${salt}`).toString(CryptoJs.enc.Hex),
        c: "MusicFree",
        v: "1.14.1",
        f: "json",
    };
    return (await axios_1.default.get(`${url}/rest/${urlPath}`, {
        params: Object.assign(Object.assign({}, preParams), params),
    })).data;
}
function formatMusicItem(it) {
    return Object.assign(Object.assign({}, it), { artwork: it.coverArt });
}
function formatAlbumItem(it) {
    return Object.assign(Object.assign({}, it), { artwork: it.coverArt });
}
function formatArtistItem(it) {
    return Object.assign(Object.assign({}, it), { avatar: it.artistImageUrl });
}
async function searchMusic(query, page) {
    const data = await httpGet('search2', {
        query,
        songCount: pageSize,
        songOffset: (page - 1) * pageSize
    });
    const songs = data['subsonic-response'].searchResult2.song;
    return {
        isEnd: songs.length < pageSize,
        data: songs.map(formatMusicItem)
    };
}
async function searchAlbum(query, page) {
    const data = await httpGet('search2', {
        query,
        albumCount: pageSize,
        albumOffset: (page - 1) * pageSize
    });
    const songs = data['subsonic-response'].searchResult2.album;
    return {
        isEnd: songs.length < pageSize,
        data: songs.map(formatAlbumItem)
    };
}
async function searchArtist(query, page) {
    const data = await httpGet('search2', {
        query,
        songCount: pageSize,
        songOffset: (page - 1) * pageSize
    });
    const songs = data['subsonic-response'].searchResult2.song;
    return {
        isEnd: songs.length < pageSize,
        data: songs.map(formatMusicItem)
    };
}
async function getAlbumInfo(albumItem) {
    const data = await httpGet('getAlbum', {
        id: albumItem.id
    });
    return {
        isEnd: true,
        data: data['subsonic-response'].album.song.map(formatMusicItem)
    };
}

// 添加这个新函数到你的文件中
async function getTopLists() {
    // Navidrome/Subsonic API 提供了多种获取列表的方式，我们将它们定义为不同的榜单
    // 'id' 字段的设计是关键，它会把API类型信息传递给 getTopListDetail 函数
    return [
        {
            title: "官方榜单",
            data: [
                {
                    id: "type:newest",
                    title: "最新入库",
                    coverImg: "https://testingcf.jsdelivr.net/gh/maotoumao/MusicFreePlugins@v0.1/dist/navidrome/latest.png"
                },
                {
                    id: "type:frequent",
                    title: "播放最多",
                    coverImg: "https://testingcf.jsdelivr.net/gh/maotoumao/MusicFreePlugins@v0.1/dist/navidrome/frequent.png"

                },
                {
                    id: "type:highest",
                    title: "评分最高",
                    coverImg: "https://testingcf.jsdelivr.net/gh/maotoumao/MusicFreePlugins@v0.1/dist/navidrome/highest.png"
                },
            ],
        },
        {
            title: "智能推荐",
            data: [
                {
                    id: "type:random",
                    title: "随机推荐",
                    coverImg: "https://testingcf.jsdelivr.net/gh/maotoumao/MusicFreePlugins@v0.1/dist/navidrome/random.png"
                },
                {
                    id: "type:recent",
                    title: "最近播放",
                    coverImg: "https://testingcf.jsdelivr.net/gh/maotoumao/MusicFreePlugins@v0.1/dist/navidrome/recent.png"
                },
            ],
        },
    ];
}


async function getTopListDetail(topListItem) {
    // 1. 从 id 中解析出 API 类型
    if (!topListItem.id || !topListItem.id.startsWith("type:")) {
        return { isEnd: true, musicList: [] };
    }
    const apiType = topListItem.id.split(':')[1];

    // 2. 调用 httpGet 获取榜单上的专辑列表 (这里我们取前 20 个专辑)
    const albumListData = await httpGet('getAlbumList2', {
        type: apiType,
        size: 20 
    });

    const albums = albumListData['subsonic-response']?.albumList2?.album;
    if (!albums || albums.length === 0) {
        return { isEnd: true, musicList: [] };
    }

    // 3. 并发地获取每个专辑下的所有歌曲
    // 使用 Promise.all 可以大大提高效率
    const songPromises = albums.map(album => httpGet('getAlbum', { id: album.id }));
    const albumDetailsResults = await Promise.all(songPromises);

    // 4. 将所有专辑中的歌曲合并成一个列表，并格式化
    const musicList = albumDetailsResults
        .flatMap(result => result['subsonic-response']?.album?.song || [])
        .map(formatMusicItem);

    return {
        // 因为我们一次性获取了所有歌曲，所以 isEnd 总是 true
        isEnd: true,
        musicList: musicList
    };
}



module.exports = {
    platform: "Navidrome",
    version: "0.0.0",
    author: 'ninglang',
    appVersion: ">0.1.0-alpha.0",
    srcUrl: "https://raw.githubusercontent.com/yzmninglang/bili-musicfree/refs/heads/main/index.js",
    cacheControl: "no-cache",
    userVariables: [
        {
            key: "url",
            name: "服务器地址",
        },
        {
            key: "username",
            name: "用户名",
        },
        {
            key: "password",
            name: "密码",
        },
    ],
    supportedSearchType: ["music", "album"],
    async search(query, page, type) {
        if (type === "music") {
            return await searchMusic(query, page);
        }
        if (type === "album") {
            return await searchAlbum(query, page);
        }
    },
    async getMediaSource(musicItem) {
        var _a;
        const userVariables = (_a = env === null || env === void 0 ? void 0 : env.getUserVariables()) !== null && _a !== void 0 ? _a : {};
        let { url, username, password } = userVariables;
        if (!(url && username && password)) {
            return null;
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = `http://${url}`;
        }
        const salt = Math.random().toString(16).slice(2);
        const urlObj = new URL(`${url}/rest/stream`);
        urlObj.searchParams.append('u', username);
        urlObj.searchParams.append('s', salt);
        urlObj.searchParams.append('t', CryptoJs.MD5(`${password}${salt}`).toString(CryptoJs.enc.Hex));
        urlObj.searchParams.append('c', 'MusicFree');
        urlObj.searchParams.append('v', '1.14.1');
        urlObj.searchParams.append('f', 'json');
        urlObj.searchParams.append('id', musicItem.id);
        return {
            url: urlObj.toString()
        };
    },
    getTopLists,
    getTopListDetail
};
