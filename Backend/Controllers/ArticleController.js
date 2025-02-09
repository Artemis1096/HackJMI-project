import mongoose from 'mongoose';
import Article from '../Models/article.js';

// Controller to create a new article
export const create = async (req, res) => {
    try {
        // Extract title, content, image, and category from request body
        const {title, content, image, category} = req.body;
        
        // Create a new article instance
        const newArticle = new Article({
            title,
            content,
            image,
            category
        });
        
        // Save the new article to the database
        if(newArticle){
            await newArticle.save();
            res.status(200).json({message: 'Article created successfully', newArticle});
        }else{
            res.status(400).json({message : "Error posting article"});
        }
    } catch (error) {
        console.log("Error in creating article", error.message);
        res.status(500).json({error : "Internal Server Error"});
    }
}

// Controller to update an existing article
export const update = async(req, res) => {
    try {
        // Extract article ID from request parameters
        const id = req.params.id;
        
        // Validate if the provided ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: "Invalid article ID" });

        // Find and update the article with the provided data
        const updatedArticle = await Article.findByIdAndUpdate(
            id,
            {$set : req.body},
            {new : true} // Return the updated article
        );

        if(!updatedArticle)
            return res.status(404).json({message : "Article not found"});

        res.status(200).json({message : "Article updated successfully"});

    } catch (error) {
        console.log("Error updating article", error.message);
        res.status(500).json({error : "Internal Server Error"});
    }
}

// Controller to delete an article
export const remove = async (req, res) => {
    try {
        // Extract article ID from request parameters
        const id = req.params.id;
        
        // Validate if the provided ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: "Invalid article ID" });

        // Find and delete the article
        const deletedArticle = await Article.findByIdAndDelete(id);
        if (!deletedArticle) {
            return res.status(404).json({ message: "Article not found" });
        }

        res.status(200).json({ message: "Article deleted successfully" });

    } catch (error) {
        console.error("Error deleting article:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Controller to get details of a single article
export const getArticleDetails = async (req, res) => {
    try {
        // Extract article ID from request parameters
        const id = req.params.id;
        const userId = req.user._id;
        
        // Validate if the provided ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: "Invalid article ID" });

        // Find the article by ID
        const article = await Article.findById(id);
        if(!article)
            return res.status(404).json({message : "Article not found"});
        
        // Check if the article is liked by the current user
        const updatedArticle = {
            ...article,
            isLikedByCurrentUser: article.likes?.includes(userId) || false
        };
          
        res.status(200).json(updatedArticle);

    } catch (error) {
        console.log("Error getting article details");
        res.status(500).json({error : "Internal server error"});
    }
}

// Controller to fetch all articles
export const getArticles = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);
        
        // Retrieve all articles from the database
        const articles = await Article.find().lean();
        
        // Attach like status for the current user
        const articlesWithLikeStatus = articles.map((article) => ({
            ...article,
            likedByCurrentUser: article.likes.some((like) => like.equals(userId))
        }));

        res.status(200).json({
            message: "Success", 
            data: articlesWithLikeStatus
        });
    } catch (error) {
        console.log("Error getting articles", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Controller to like/unlike an article
export const toggleLike = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user._id;

        // Find the article by ID
        const article = await Article.findById(id);
        if(!article)
            return res.status(404).json({message : "User not found"});

        // Check if the user has already liked the article
        const likedIndex = article.likes.indexOf(userId);

        // Toggle like status
        if(likedIndex === -1)
            article.likes.push(userId);
        else
            article.likes.splice(likedIndex, 1);

        await article.save();

        res.status(200).json({ message: "Success", likesCount : article.likes.length, likedByCurrentUser : article.likes.includes(userId)});

    } catch (error) {
        console.error("Error liking article:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Controller to fetch articles based on category
export const getArticlesCategoryWise = async (req, res) => {
    try {
        const { category } = req.query;
        
        // Validate that category query parameter is provided
        if (!category) {
            return res.status(400).json({ message: "Category query parameter is required" });
        }

        // Fetch articles based on category, case insensitive search
        const articles = await Article.find({ category: { $regex: category, $options: "i" } }).sort({ createdAt: -1 });
        
        // Attach like status for the current user
        const articlesWithLikeStatus = articles.map((article) => ({
            ...article,
            likedByCurrentUser : article.likes.includes(userId)
        }));
        
        res.status(200).json(articlesWithLikeStatus);
    } catch (error) {
        console.error("Error getting articles with category:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
