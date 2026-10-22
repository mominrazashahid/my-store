<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Free Plan Product Limit
    |--------------------------------------------------------------------------
    |
    | Maximum number of products a store on the free plan may create.
    |
    */

    'free_plan_product_limit' => (int) env('FREE_PLAN_PRODUCT_LIMIT', 20),

    /*
    |--------------------------------------------------------------------------
    | Marketplace Feed
    |--------------------------------------------------------------------------
    |
    | The platform home page mixes products from every listed store. Each
    | store contributes at most `per_store` products so no single store
    | dominates, and the feed shows at most `size` products.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Cash On Delivery Countries
    |--------------------------------------------------------------------------
    |
    | Shipping-address countries where buyers may pay cash on delivery. Orders
    | to anywhere else need online payment, which isn't available yet.
    |
    */

    'cod_countries' => ['PK'],

    'marketplace' => [
        'per_store' => 4,
        'size' => 48,
    ],

];
