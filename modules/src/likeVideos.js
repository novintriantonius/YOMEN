module.exports = {
    likeVideos: async (page) => {
      try {
        await page
          .evaluate(() => {
            document
              .querySelector(
                ".ytd-menu-renderer:nth-child(1) > .ytd-toggle-button-renderer > #button > #button > .style-scope"
              )
              .click();
          })
          .catch((err) => {
            //console.log(err);
          });
      } catch (error) {}
    },
  };
  