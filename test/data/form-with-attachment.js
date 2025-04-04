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
                    <city/>
                </data>
            </instance>
            <instance id="cities" src="jr://file-csv/cities.csv"/>
            <bind nodeset="/data/meta/instanceID" type="string" readonly="true()" calculate="concat('uuid:', uuid())"/>
            <bind nodeset="/data/first_name" type="string"/>
            <bind nodeset="/data/city" type="string"/>
        </model>
    </h:head>
    <h:body>
        <input ref="/data/first_name">
            <label>First Name</label>
        </input>
        <select1 ref="/data/city">
            <label>City</label>
            <itemset nodeset="instance('cities')/root/item">
                <value ref="name"/>
                <label ref="label"/>
            </itemset>
        </select1>
    </h:body>
</h:html>`;
