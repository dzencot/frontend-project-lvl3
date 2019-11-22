const parsePost = (data) => {
  const link = data.querySelector('link');
  const title = data.querySelector('title');
  const description = data.querySelector('description');
  if (link.length === 0 && title.length === 0 && description.length === 0) {
    const errorMessage = 'Not found post data';
    throw new Error(errorMessage);
  }
  return {
    link: link.textContent || link.getAttribute('href'),
    title: title.textContent,
    description: description ? description.textContent : '',
  };
};

const parseFeed = (data) => {
  const domParser = new DOMParser();
  const parsedData = domParser.parseFromString(data, 'text/xml');

  const rss = parsedData.querySelector('rss');
  if (rss.length === 0) {
    const errorMessage = 'Not found feed data';
    throw new Error(errorMessage);
  }
  const link = rss.querySelector('channel > link');
  const title = rss.querySelector('channel > title');
  const description = rss.querySelector('channel > description');

  const dataPosts = Array.from(rss.querySelectorAll('item'));

  const items = dataPosts.map((item) => parsePost(item));

  return {
    link: link.textContent,
    title: title.textContent,
    description: description.textContent,
    items,
  };
};

export default parseFeed;
