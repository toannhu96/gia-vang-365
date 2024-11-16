# Vietnamese Gold Price API

A RESTful API service and telegram bot that provides real-time Vietnamese gold prices from DOJI. Free api at [https://api.giavang365.io.vn/](https://api.giavang365.io.vn/)

## Features

- [x] Real-time Vietnamese gold price data from DOJI
- [x] Rate limiting (100 requests per minute)
- [x] Redis caching (5 minutes TTL)
- [x] Swagger documentation
- [x] Health check endpoints
- [x] Graceful shutdown
- [x] Telegram Bot for easy access

## Docs: 

[https://api.giavang365.io.vn/docs](https://api.giavang365.io.vn/docs)

### Get gold prices
```bash
curl --location 'https://api.giavang365.io.vn/v1/gold-prices' \
--header 'accept: application/json'
```

### Telegram Bot

Use our Telegram bot for easy access to gold prices:
1. Start chat with [@giavang365bot](https://t.me/giavang365bot)
2. Available commands:
   - `/start` - Start the bot
   - `/gold` - Get current gold prices
   - `/subscribe` - Get daily updates at 7 AM
   - `/unsubscribe` - Stop daily updates
   - `/help` - Show all available commands

## Contributing

Feel free to submit issues or pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the Apache 2.0 License.

## Author

- Email: [toanbk21096@gmail.com](mailto:toanbk21096@gmail.com)
- Linkedin: [@toannhu](https://www.linkedin.com/in/toannhu/)

<a href="https://buymeacoffee.com/toannhu" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>