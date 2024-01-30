import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*'
}));

// Serve static files from the 'images' directory
app.use('/images', express.static(path.join(__dirname, 'images')));

const port = 8080;

// Array of local image paths (assuming they are stored in the 'images' directory)
const imagePaths = [
    'image1.png',  // Replace with your actual image file names
    'image2.png',
    // Add more file names as needed
];

interface IFrameProps {
    frame?: string;
    imageUrl: string;
    buttons?: { text: string, action: string }[];
    imageIndex?: number; // Track the current image index
}

function generateFarcasterFrameMetaTag({ frame, imageUrl, buttons }: IFrameProps): string {
    // Default to vNext
    if (!frame) {
        frame = "vNext";
    }
    // Ensure there are at most four buttons
    if (buttons && buttons.length > 4) {
        throw new Error("Maximum of four buttons are allowed per frame.");
    }

    // Generate Open Graph tags for image, redirect, and buttons
    let metaTag = `<meta property="fc:frame" content="${frame}" />\n`;
    metaTag += `<meta property="fc:frame:image" content="${imageUrl}" />\n`;

    if (buttons) {
        buttons.forEach((button, index) => {
            metaTag += `<meta property="fc:frame:button:${index + 1}" content="${button.text}" />\n`;
            metaTag += `<meta property="fc:frame:button:${index + 1}:action" content="${button.action}" />\n`;
        });
    }

    return metaTag;
}

function frameGenerator(frameProps: IFrameProps): string {
    const metaTag = generateFarcasterFrameMetaTag(frameProps);

    const html = `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>Farcaster x Express Frame template</title>
                <meta property="og:title" content="Farcaster x Express Frame" />
                <meta property="og:image" content="${frameProps.imageUrl}" />
                ${metaTag}
            </head>
        </html>
    `;
    return html;
}

app.get('/frame', (req, res) => {
    let imageIndex = parseInt(req.query.imageIndex as string) || 0;
    imageIndex = Math.max(0, Math.min(imageIndex, imagePaths.length - 1)); // Ensure index is within bounds

    const imageUrl = `http://${req.headers.host}/images/${imagePaths[imageIndex]}`;

    const frameProps: IFrameProps = {
        imageUrl: imageUrl,
        imageIndex: imageIndex,
        buttons: [
            { text: 'Previous', action: `/frame?imageIndex=${Math.max(imageIndex - 1, 0)}` },
            { text: 'Next', action: `/frame?imageIndex=${Math.min(imageIndex + 1, imagePaths.length - 1)}` }
        ],
    };

    res.status(200).send(frameGenerator(frameProps));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
