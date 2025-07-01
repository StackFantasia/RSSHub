import { Route, Data, DataItem } from '@/types';
import ofetch from '@/utils/ofetch';
import * as cheerio from 'cheerio';
import { createHash } from 'node:crypto';

const ROOT_URL = 'https://www.sge.com.cn';
const PAGE_URL = `${ROOT_URL}/sjzx/yshqbg`;
const TABLE_SELECTOR = '.memberName table';

// 读取页面内容
const fetchPageContent = async (url: string) => {
    const response = await ofetch(url);
    return cheerio.load(response);
};

// 提取行情数据
const extractDataItems = ($: cheerio.Root, pageURL: string): DataItem[] => {
    const pubDate = new Date().toUTCString();

    const rows = $(`${TABLE_SELECTOR} tr`).slice(1); // 跳过表头

    return rows
        .toArray()
        .map((row) => {
            const cols = $(row).find('td');
            if (cols.length < 5) {
                return null;
            }

            const contract = $(cols[0]).text().trim();
            const latest = $(cols[1]).text().trim();
            const high = $(cols[2]).text().trim();
            const low = $(cols[3]).text().trim();
            const open = $(cols[4]).text().trim();

            const raw = [contract, latest, high, low, open, pubDate].map((s) => s.replaceAll(/\s+/g, '')).join('|');
            const guid = createHash('md5').update(raw).digest('hex');

            return {
                title: `${contract} 最新价 ${latest}`,
                link: pageURL,
                pubDate,
                guid,
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
};

const handler = async (): Promise<Data> => {
    const $ = await fetchPageContent(PAGE_URL);

    const items = extractDataItems($, PAGE_URL);

    return {
        title: '上海黄金交易所 - 延时行情',
        link: PAGE_URL,
        item: items,
        allowEmpty: true,
        ttl: 1,
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
