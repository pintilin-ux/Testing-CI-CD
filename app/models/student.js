// Get the functions in the db.js file to use
const db = require('./../services/db');
const { Programme } = require('./programme');
const { Module } = require('./module');

class Student {
    // Student ID
    id;
    // Student name
    name;
    // Student programme of type Programme
    programme;

    // Student note
    note;
    // Student modules: array of type Module
    modules = [];

    constructor(id) {
        this.id = id;
    }
    
    async getStudentDetails() {
        if (typeof this.name !== 'string') {
            var sql = "SELECT * from Students where id = ?"
            const results = await db.query(sql, [this.id]);
            this.name = results[0].name;
            this.note = results[0].note;
        }

    }
    
    // Gets the programme of this student
    async getStudentProgramme()  {
        if(typeof this.programme !== Programme) {
            var sql = "SELECT * from Programmes p \
            JOIN Student_Programme sp ON p.id = sp.programme \
            WHERE sp.id = ?"
            const results = await db.query(sql, [this.id]);
            this.programme = new Programme(results[0].programme);
            this.programme.pName = results[0].name;
        }
       
    }
    

    async deleteStudentProgramme(programme) {
        var sql = "DELETE FROM Student_Programme WHERE id = ?";
        const result = await db.query(sql, [this.id]);
        // Ensure the note property in the model is up to date
        this.programme = '';
        return result;
    }



    async addStudentProgramme(programme) {
        var sql = "INSERT INTO Student_Programme (id, programme) VALUES (?, ?)";
        const result = await db.query(sql, [this.id, programme]);
        // Ensure the note property in the model is up to date
        this.programme = programme;
        return result;
    }


    async updateStudentProgramme(programme) {
        const existing  = await this.getStudentProgramme();
        if(this.programme) {
            await this.deleteStudentProgramme(programme);
        }
        await this.addStudentProgramme(programme);
    }


    async addStudentNote(note) {
        var sql = "UPDATE Students SET note = ? WHERE Students.id = ?"
        const result = await db.query(sql, [note, this.id]);
        // Ensure the note property in the model is up to date
        this.note = note;
        return result;
    }

    async getStudentModules() {
        var sql = "SELECT * FROM Programme_Modules pm \
        JOIN Modules m on m.code = pm.module \
        WHERE programme = ?";
        const results = await db.query(sql, [this.programme.id]);
        for(var row of results) {
            this.modules.push(new Module(row.code, row.name));
        }
    }
}



module.exports = {
    Student
}