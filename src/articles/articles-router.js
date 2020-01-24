const express = require("express");
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
            title: article.title,
            style: article.style,
            content: article.content
          }))
        );
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get("db");
    const { title, content, style } = req.body;
    const newArticle = { title, content, style };
    ArticleService.insertArticle(knexInstance, newArticle)
      .then(article => {
        res
          .status(201)
          .location(`/articles/${article.id}`)
          .json(article);
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
      res.json(
        res.json({
          id: article.id,
          date_published: new Date(article.date_published),
          title: article.title,
          style: article.style,
          content: article.content
        })
      );
    })
    .catch(next);
});

module.exports = articlesRouter;
