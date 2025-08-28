import requests
import json

def get_collection_videos(mid, season_id):
    """
    获取Bilibili合集中的所有视频信息

    :param mid: UP主的用户ID (mid)
    :param season_id: 合集的ID (sid)
    :return: 包含所有视频信息的列表
    """
    api_url = "https://api.bilibili.com/x/polymer/web-space/seasons_archives_list"
    videos = []
    page_num = 1
    page_size = 30

    # 设置请求头，模拟浏览器访问
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': f'https://space.bilibili.com/{mid}/channel/collectiondetail?sid={season_id}'
    }

    while True:
        params = {
            "mid": mid,
            "season_id": season_id,
            "sort_reverse": "false",
            "page_num": page_num,
            "page_size": page_size
        }

        try:
            # 在请求中加入headers
            response = requests.get(api_url, params=params, headers=headers)
            response.raise_for_status()  # 检查HTTP请求是否成功
            data = response.json()

            if data.get("code") == 0:
                archives = data.get("data", {}).get("archives", [])
                if not archives:
                    # 如果当前页没有视频，说明已经获取完毕
                    break
                
                videos.extend(archives)
                
                # 判断是否已获取所有视频
                total_videos = data.get("data", {}).get("page", {}).get("total", 0)
                if len(videos) >= total_videos:
                    break

                page_num += 1
            else:
                print(f"API返回错误: {data.get('message', '未知错误')}")
                break
        except requests.exceptions.RequestException as e:
            print(f"网络请求错误: {e}")
            return None # 网络问题，返回None
        except json.JSONDecodeError:
            print("解析JSON响应失败")
            return None # 解析失败，返回None
            
    return videos

if __name__ == "__main__":
    # 目标合集的URL
    collection_url = "https://space.bilibili.com/8096990/channel/collectiondetail?sid=942900"
    
    # 从URL中提取mid和sid
    user_mid = collection_url.split('/')[3]
    collection_sid = collection_url.split('sid=')[1]

    print(f"正在获取UP主(mid={user_mid})的合集(sid={collection_sid})中的视频信息...")
    
    video_list = get_collection_videos(user_mid, collection_sid)

    if video_list:
        print(f"\n成功获取到 {len(video_list)} 个视频的信息：")
        # 打印前5个视频作为示例
        for video in video_list[:5]:
            print("--------------------")
            print(f"视频标题: {video['title']}")
            print(f"BV号: {video['bvid']}")
            print(f"播放量: {video.get('stat', {}).get('view', 'N/A')}")
            print(f"点赞数: {video.get('stat', {}).get('like', 'N/A')}")
    elif video_list is None:
        print("由于网络或解析错误，获取视频信息失败。")
    else:
        print("未能获取到视频信息或合集为空。")