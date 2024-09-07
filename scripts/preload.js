async function pageLoading()
{
    await StorageHandler.validateDatabase();
    var selectedTheme = StorageHandler.getLocal('env.theme', false);
    if (selectedTheme)
        document.documentElement.setAttribute('data-bs-theme', selectedTheme);
}

async function indexLoading()
{
    await pageLoading();
    var hasStoredItems = await StorageHandler.hasDatabaseItems();
    if (hasStoredItems)
        document.getElementById('db-cache-container').classList.remove('hidden');
}

async function editorLoading()
{
    await pageLoading();
    var editingStr = await StorageHandler.getIndexed('editing', true);
    if (!editingStr)
        window.location = 'index.html';
}