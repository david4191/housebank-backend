-- 017_customer_wishlists.sql
-- Persist customer property saves for the /wishlist API.
--
-- Run once against each database:
--   mysql -u <db_user> -p <db_name> < database/migrations/017_customer_wishlists.sql

CREATE TABLE IF NOT EXISTS wishlists (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    property_id     BIGINT UNSIGNED NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    UNIQUE KEY uq_wishlist_user_property (user_id, property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;