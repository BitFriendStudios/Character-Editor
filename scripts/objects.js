class CardData
{
    #jsonData;

    constructor(data)
    {
        this.#jsonData = data;
        if (!this.#jsonData)
            throw new Error("Tried to open card with NULL data");
        if (this.Type == Serializer.TYPE_NOVELAI)
            throw new Error("NovelAI chat logs are currently not supported");
    }

    get Type() { return this.#jsonData["type"] ??= Serializer.TYPE_SILLYTAVERN; }

    get Version() { return this.#jsonData["version"] ??= '2.0'; }

    get Image() { return this.#jsonData["image"] ??= ""; }

    set Image(value)
    {
        if (typeof value === "string")
        {
            this.#jsonData["image"] = value;
            return;
        }
        Serializer.readBlobData(value).then((blob) => this.#jsonData["image"] = blob, (reason) => console.error(reason));
    }

    get Name() { return this.Data["name"] ??= ""; }

    set Name(value) { this.#SetValue(value, "name"); }

    get Description() { return this.Data["description"] ??= ""; }

    set Description(value) { this.#SetValue(value, "description"); }

    get Personality() { return this.Data["personality"] ??= ""; }

    set Personality(value) { this.#SetValue(value, "personality"); }

    get Scenario() { return this.Data["scenario"] ??= ""; }

    set Scenario(value) { this.#SetValue(value, "scenario"); }

    get FirstMessage() { return this.Data["first_mes"] ??= ""; }

    set FirstMessage(value) { return this.#SetValue(value, "first_mes"); }

    get AltGreetings() { return this.Data["alternate_greetings"] ??= []; }

    set AltGreetings(value) { return this.Data["alternate_greetings"] = value; }

    GetOrAddAltGreeting(index)
    {
        var item = this.AltGreetings[index];
        if (item)
            return item;
        this.AltGreetings[index] = "";
        return this.AltGreetings[index];
    }

    AddAltGreeting(value) { this.AltGreetings.push(value); }

    RemoveAltGreeting(value)
    {
        if (typeof value === 'number')
            this.AltGreetings.splice(value, 1);
        else if (this.AltGreetings.indexof(value))
            this.AltGreetings.splice(this.AltGreetings.indexof(value), 1);
    }

    get MessageExamples() { return this.Data["mes_example"] ??= ""; }

    set MessageExamples(value) { return this.#SetValue(value, "mes_example"); }

    get CreatorName() { return this.Data["creator"] ??= ""; }

    set CreatorName(value)
    {
        this.#SetValue(value, "creator");
        this.BitFriendsMetadata["creator"] = value;
    }

    get CharacterVersion() { return this.Data["character_version"] ??= ""; }

    set CharacterVersion(value)
    {
        this.#SetValue(value, "character_version");
        this.BitFriendsMetadata["char_version"] = value;
    }

    get CreatorNotes() { return this.Data["creator_notes"] ??= ""; }

    set CreatorNotes(value) { this.#SetValue(value, "creator_notes"); }

    get UpdatedAt() { return (this.BitFriendsMetadata["updated"] ?? "").replace('T', ', '); }

    set UpdatedAt(value)
    {
        if (!value)
        {
            delete this.BitFriendsMetadata["updated"];
            return;
        }
        this.BitFriendsMetadata["updated"] = value;
    }

    get CreatedAt()
    {
        if (this.BitFriendsMetadata["created"])
            return this.BitFriendsMetadata["created"].replace('T', ', ');

        if (this.Type == Serializer.TYPE_SILLYTAVERN && this.Data["create_date"])
        {
            var fixed = this.#FixSTDateFormat(this.Data["create_date"]);
            if (!fixed)
                return "Unable to read date from SillyTavern card data";
            this.BitFriendsMetadata["created"] = fixed;
            return fixed.replace('T', ', ');
        }
    }

    get Data()
    {
        if ((this.Version == "1.0" || this.Version == "1"))
            return this.#V1Data;
        return this.#V2Data;
    }

    get Metadata() { return this.Data["metadata"] ??= {}; }

    get BitFriendsMetadata() { return this.Metadata["BitFriends"] ??= {}; }

    get #V1Data() { return this.#jsonData["data"]; }

    get #V2Data() { return this.#V1Data["data"]; }

    #SetValue(value, name)
    {
        this.#V1Data[name] = value;
        if (this.Version == '1.0')
            return;
        this.#V2Data[name] = value;
    }

    #FixSTDateFormat(dateStr)
    {
        if (!dateStr)
            return null;

        let year, month, day, hour, minute, second, millisecond;

        dateStr = dateStr.replace('@', ''); //Remove @ time symbol

        var dtSplit = dateStr.split(' '); //Split date and time
        var dateSplit = dtSplit[0].split('-'); //Split date

        year = dateSplit[0];
        month = dateSplit[1];
        day = dateSplit[2];

        for (var i = 1; i < dtSplit.length; i++) //Filter time fragments
        {
            if (dtSplit[i].endsWith('ms'))
                millisecond = dtSplit[i].replace('ms', '');
            else if (dtSplit[i].endsWith('s'))
                second = dtSplit[i].replace('s', '');
            else if (dtSplit[i].endsWith('m'))
                minute = dtSplit[i].replace('m', '');
            else if (dtSplit[i].endsWith('h'))
                hour = dtSplit[i].replace('h', '');
        }

        return `${year}-${month}-${day}T${hour}:${minute}:${second}`; //Build to default datetime format
    }

    ToJSON()
    {
        var obj = {
            'type': this.Type,
            'version': this.Version,
            'image': this.Image,
            'data': JSON.stringify(this.#jsonData["data"])
        };

        return obj;
    }

    ToString() { return JSON.stringify(this.ToJSON()); }
}