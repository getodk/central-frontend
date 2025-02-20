export default `<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:jr="http://openrosa.org/javarosa">
    <h:head>
        <h:title>simple</h:title>
        <model>
            <instance>
                <data id="simple">
                    <meta>
                        <instanceID/>
                    </meta>
                    <first_name/>
                </data>
            </instance>
            <bind nodeset="/data/meta/instanceID" type="string" readonly="true()" calculate="concat('uuid:', uuid())"/>
            <bind nodeset="/data/first_name" type="string"/>
        </model>
    </h:head>
    <h:body>
        <input ref="/data/first_name">
            <label>First Name</label>
        </input>
    </h:body>
</h:html>`;
