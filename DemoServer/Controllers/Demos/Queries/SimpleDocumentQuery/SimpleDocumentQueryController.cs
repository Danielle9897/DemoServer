﻿using System.Threading.Tasks;
using DemoServer.Utils;
using DemoServer.Utils.Cache;
using DemoServer.Utils.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
#region Usings
using System.Collections.Generic;
using System.Linq;
#endregion

namespace DemoServer.Controllers.Demos.Queries.SimpleDocumentQuery
{
    public class SimpleDocumentQueryController : DemoCodeController
    {
        public SimpleDocumentQueryController(HeadersAccessor headersAccessor, DocumentStoreCache documentStoreCache,
            DatabaseAccessor databaseAccessor) : base(headersAccessor, documentStoreCache, databaseAccessor)
        {
        }

        private Employee initialCompanyDocument => new Employee
        {
            Id = "employees/1-A",
            Name = "Ayende Rahien",
            Phone = "(+972)52-5486969"
        };
        
        private async Task SetRunPrerequisites(string employeeDocumentId)
        {
            await DatabaseAccessor.EnsureDocumentExists(UserId, employeeDocumentId, initialCompanyDocument);
        }
        
        [HttpPost]
        public async Task<IActionResult> Run(RunParams runParams)
        {
            var employeeDocumentId = runParams.EmployeeDocumentId;
            await SetRunPrerequisites(employeeDocumentId);
            
            #region Demo
            
            using (var session = DocumentStoreHolder.Store.OpenSession())
            {
                #region Step_1
                var documentQuery = session.Query<Employee>().Where(x => x.Id == employeeDocumentId);
                var employee = documentQuery.FirstOrDefault();
                #endregion
            }
            
            #endregion 
            
            //TODO: How to show results ?
            return Ok($"Document {employeeDocumentId} details are: ... TODO: Show Query Results ..."); 
        }
        
        private class Employee
        {
            public string Id { get; set; }
            public string Name { get; set; }
            public string Phone { get; set; }
        }
        
        public class RunParams
        {
            public string EmployeeDocumentId { get; set; }
        }
    }
}
