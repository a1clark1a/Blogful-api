const express = require("express");
const xss = require("xss");
const ArticleService = require("./articles_service");

const articlesRouter = express.Router();
const jsonParser = express.json();

articlesRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    ArticleService.getAllArticles(knexInstance)
      .then(articles => {
        res.json(
          articles.map(article => ({
            id: article.id,
            date_published: new Date(article.date_published),
            title: xss(article.title),
            style: article.style,
            content: xss(article.content)
          }))
        );
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get("db");
    const { title, content, style } = req.body;
    const newArticle = { title, content, style };

    for (const [key, value] of Object.entries(newArticle)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }

    ArticleService.insertArticle(knexInstance, newArticle)
      .then(article => {
        res
          .status(201)
          .location(`/articles/${article.id}`)
          .json({
            id: article.id,
            date_published: new Date(article.date_published),
            title: xss(article.title),
            style: article.style,
            content: xss(article.content)
          });
      })
      .catch(next);
  });

articlesRouter.route("/:article_id").get((req, res, next) => {
  const knexInstance = req.app.get("db");
  const { article_id } = req.params;
  ArticleService.getById(knexInstance, article_id)
    .then(article => {
      if (!article) {
        return res.status(404).json({
          error: { message: `Article doesn't exist` }
        });
      }
      res.json({
        id: article.id,
        date_published: new Date(article.date_published),
        title: xss(article.title),
        style: article.style,
        content: xss(article.content)
      });
    })
    .catch(next);
});

module.exports = articlesRouter;
