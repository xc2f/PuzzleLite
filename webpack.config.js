// webpack.config.js
var webpack = require("webpack");
var path = require("path");

module.exports = {
    entry: './src/app.js', // 入口文件
    devtool: 'source-map', // 调试时定位到编译前的代码位置，推荐安装react插件
    output: {
        path: path.resolve(__dirname, "./build/"),
        filename: 'bundle.js' // 打包输出的文件
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/, // test 去判断是否为.js或.jsx,是的话就是进行es6和jsx的编译
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }, {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'style-loader'
                    }, {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    }, {
                        loader: 'postcss-loader'
                    }
                ]
            }
        ]
    },
    resolve: {
        // 现在你import文件的时候可以直接使用import Func from './file'，不用再使用import Func from
        // './file.js'
        extensions: ['.js', '.jsx', '.json', '.coffee']
    }
};
