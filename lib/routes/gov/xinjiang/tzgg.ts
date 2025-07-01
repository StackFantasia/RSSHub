import { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/xinjiang/tzgg',
    categories: ['government'],
    example: '/gov/xinjiang/tzgg',
    parameters: {},
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
            source: ['zrzyt.xinjiang.gov.cn/', 'zrzyt.xinjiang.gov.cn/xjgtzy'],
        },
    ],
    name: '新疆维吾尔自治区自然资源厅通知公告',
    maintainers: ['FatansiaTrace'],
    handler,
    url: 'zrzyt.xinjiang.gov.cn/xjgtzy/tzgg/',
};

async function handler() {
    const rootUrl = 'https://zrzyt.xinjiang.gov.cn';
    const currentUrl = `${rootUrl}/xjgtzy/tzgg/common_list.shtml`;
    const response = await got(currentUrl);

    const $ = load(response.data);

    const listItems = $('#list-data ul.list li');

    const items = listItems.toArray().map((li) => {
        const el = $(li);
        const a = el.find('a');
        const title = a.text().trim();
        const href = a.attr('href');
        const link = href?.startsWith('http') ? href : `${rootUrl}${href}`;
        const pubDate = parseDate(el.find('span').text().trim());

        return {
            title,
            link,
            pubDate,
        };
    });

    return {
        title: `新疆维吾尔自治区自然资源厅 - 通知公告`,
        link: currentUrl,
        item: items,
    };
}
