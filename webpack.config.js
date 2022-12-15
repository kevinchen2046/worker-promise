const path = require('path');
const os = require('os');
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

let common_config = {
    entry: ['./src/main'],
    output: {
        filename: 'js/bundle.js',
        path: path.join(__dirname, 'bin'),
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        modules: [
            path.resolve('.'),
            path.join(__dirname, "bin"),
            path.resolve('./node_modules')
            
        ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader'
            },
        ],
    },
};


function getLocalHost(){
    let localhost = ''
    try {
        const network = os.networkInterfaces()
        localhost = network[Object.keys(network)[0]][1].address
    } catch (e) {
        localhost = '0.0.0.0'
    }
    return localhost;
}


const dev_config = {
    devtool: 'source-map',
    watch: true,
    devServer: {
        host: '10.0.0.62',
        contentBase: path.join(__dirname, 'bin'),
        hot: true,
        port: 8080,
        host: getLocalHost(),
        publicPath: "/",
        compress: true,//服务器返回浏览器时是否启动gzip压缩
        open: true,
        historyApiFallback: true,
        disableHostCheck: true,
        proxy: {
            '/api': {
                target: `http://${getLocalHost()}:8080`
            }
        }
    },
    plugins: [
        new CleanWebpackPlugin({
            dry: true,
            dangerouslyAllowCleanPatternsOutsideProject: true,
        }),
    ]
};

module.exports = (env, argv) => {
    return Object.assign(common_config, dev_config);
};
