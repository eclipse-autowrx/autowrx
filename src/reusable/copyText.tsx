import triggerSnackbar from './triggerSnackbar';

const copyText = async (text: string, copiedText: string = "Copied!") => {
    try {
        await navigator.clipboard.writeText(text);
        triggerSnackbar(copiedText)
    } catch (error) {
        triggerSnackbar(`Error occured while copying to clipboard. ${error}`);
    }
}

export default copyText