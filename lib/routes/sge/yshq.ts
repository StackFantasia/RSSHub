import { Route, Data, DataItem } from '@/types';
import ofetch from '@/utils/ofetch';
import * as cheerio from 'cheerio';
import cache from '@/utils/cache';

const ROOT_URL = 'https://www.sge.com.cn';
const PAGE_URL = `${ROOT_URL}/sjzx/yshqbg`;
const TITLE_SELECTOR = '.jzk_newsCenter_meeting .title h1';
const TABLE_SELECTOR = '.memberName table';

// 读取页面内容
const fetchPageContent = async (url: string) => {
    const response = await ofetch(url);
    return cheerio.load(response);
};

// 提取行情数据
const extractDataItems = async ($: cheerio.Root, pageURL: string): Promise<DataItem[]> => {
    const title = $(TITLE_SELECTOR).text().trim();
    const dateMatch = title.match(/(\d{4})年(\d{2})月(\d{2})日/);
    const pubDate = dateMatch ? new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`).toUTCString() : new Date().toUTCString();

    const rows = $(`${TABLE_SELECTOR} tr`).slice(1); // 跳过表头

    const items: DataItem[] = rows.toArray().map((row) => {
        const cols = $(row).find('td');
        if (cols.length < 5) {
            return null;
        }

        const contract = $(cols[0]).text().trim();
        const latest = $(cols[1]).text().trim();
        const high = $(cols[2]).text().trim();
        const low = $(cols[3]).text().trim();
        const open = $(cols[4]).text().trim();

        return {
            title: `${contract} 最新价 ${latest}`,
            link: pageURL,
            pubDate,
            description: `
                <b>合约:</b> ${contract}<br/>
                <b>最新价:</b> ${latest}<br/>
                <b>最高价:</b> ${high}<br/>
                <b>最低价:</b> ${low}<br/>
                <b>今开盘:</b> ${open}
            `,
        };
    })
    .filter((item): item is DataItem => item !== null);

    return items;
};

const handler = async (): Promise<Data> => {
    const $ = await fetchPageContent(PAGE_URL);

    const items = await cache.tryGet(PAGE_URL, () => extractDataItems($, PAGE_URL));

    return {
        title: '上海黄金交易所 - 延时行情',
        link: PAGE_URL,
        item: items,
        allowEmpty: true,
    };
};

export const route: Route = {
    path: '/yshq',
    categories: ['finance'],
    example: '/sge/yshq',
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['sge.com.cn'],
            target: '/sge/yshq',
        },
    ],
    name: '延时行情',
    maintainers: ['StackFantasia'],
    handler,
};
