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
// 替换旧的 getTopLists 函数
async function getTopLists() {
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
        // --- 新增的“电台”分类 ---
        {
            title: "电台",
            data: [
                {
                    id: "type:radio",
                    title: "网络电台",
                    coverImg: "https://testingcf.jsdelivr.net/gh/maotoumao/MusicFreePlugins@v0.1/dist/navidrome/radio.png"
                }
            ]
        },
        // --- 新增的“全部音乐”分类 ---
        {
            title: "浏览全部",
            data: [
                {
                    id: "type:alphabeticalByName",
                    title: "全部专辑 (按字母排序)",
                    coverImg: "https://testingcf.jsdelivr.net/gh/maotoumao/MusicFreePlugins@v0.1/dist/navidrome/all.png"
                }
            ]
        }
    ];
}


// 替换旧的 getTopListDetail 函数
// 替换旧的 getTopListDetail 函数
async function getTopListDetail(topListItem) {
    if (!topListItem.id || !topListItem.id.startsWith("type:")) {
        return { isEnd: true, musicList: [] };
    }
    const apiType = topListItem.id.split(':')[1];

    // --- 处理电台类型的逻辑 ---
    if (apiType === 'radio') {
        const radioData = await httpGet('getInternetRadioStations');
        
        // *** 关键修改处 ***
        // 根据你提供的 OpenSubsonic 响应，正确的路径是 internetRadioStation
        const stations = radioData['subsonic-response']?.internetRadioStations?.internetRadioStation;

        if (!stations || stations.length === 0) {
            return { isEnd: true, musicList: [] };
        }
        // 将电台数据格式化为 musicList
        const musicList = stations.map(station => ({
            id: station.id,
            title: station.name,
            artist: "网络电台", // 电台没有歌手，给一个默认值
            artwork: "https://testingcf.jsdelivr.net/gh/maotoumao/MusicFreePlugins@v0.1/dist/navidrome/radio.png", // 使用默认封面
            duration: 0, // 直播流没有时长
            url: station.streamUrl // 直接保存播放链接
        }));
        return { isEnd: true, musicList };
    }
    // --- 电台逻辑结束 ---

    // 原有的获取专辑列表逻辑，保持不变
    const albumListData = await httpGet('getAlbumList2', {
        type: apiType,
        size: 999
    });

    const albums = albumListData['subsonic-response']?.albumList2?.album;
    if (!albums || albums.length === 0) {
        return { isEnd: true, musicList: [] };
    }

    const songPromises = albums.map(album => httpGet('getAlbum', { id: album.id }));
    const albumDetailsResults = await Promise.all(songPromises);

    const musicList = albumDetailsResults
        .flatMap(result => result['subsonic-response']?.album?.song || [])
        .map(formatMusicItem);

    return {
        isEnd: true,
        musicList: musicList
    };
}


module.exports = {
    platform: "Navidrome",
    version: "0.0.0",
    author: 'ninglang',
    appVersion: ">0.1.0-alpha.0",
    srcUrl: "https://share.ninglang.top:7012/Android/musicfree/plugin/Navidrome.js",
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
