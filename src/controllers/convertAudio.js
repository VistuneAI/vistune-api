const axios = require('axios').default;
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');

// Caso necessário, ajuste o caminho para o executável do ffmpeg
ffmpeg.setFfmpegPath("C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe");

const convertAudio = async (req, res) => {
    const url = req.query.link;

    if (!url) {
        return res.status(400).send('Missing "link" parameter.');
    }

    const uid = uuidv4();
    const tempInputFilePath = `temp_${uid}.ogg`;
    const tempOutputFilePath = `temp_${uid}.mp3`;

    try {
        const response = await axios({
            method: 'get',
            url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(tempInputFilePath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            // Início da conversão de .ogg para .mp3
            ffmpeg(tempInputFilePath)
                .toFormat('mp3')
                .output(tempOutputFilePath)
                .on('end', () => {
                    // Após a conversão para .mp3, o arquivo é lido e convertido para base64
                    const mp3File = fs.readFileSync(tempOutputFilePath);
                    const base64Encoded = mp3File.toString('base64');

                    // Limpeza dos arquivos temporários
                    fs.unlinkSync(tempInputFilePath);
                    fs.unlinkSync(tempOutputFilePath);

                    // Retorna a string base64 do arquivo .mp3
                    res.send({ file: base64Encoded });
                })
                .on('error', err => {
                    res.status(500).send('Error during file conversion.');

                    // Limpa o arquivo tempory, se uma falha ocorrer durante a conversão
                    fs.unlinkSync(tempInputFilePath);
                })
                .run();
        });

        writer.on('error', () => {
            res.status(500).send('Error downloading file.');
            // Limpeza do arquivo temporário em caso de falha ao baixar
            fs.unlinkSync(tempInputFilePath);
        });
    } catch (error) {
        res.status(500).send('Error processing your request.');
    }
};

module.exports = convertAudio;