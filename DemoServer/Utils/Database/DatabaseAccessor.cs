﻿using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using DemoServer.Utils.Cache;
using Raven.Client.Documents;
using Raven.Client.Documents.Operations;
using Raven.Client.Documents.Session;
using Raven.Client.Exceptions;
using Raven.Client.Exceptions.Database;
using Raven.Client.ServerWide;
using Raven.Client.ServerWide.Operations;

namespace DemoServer.Utils.Database
{
    public class DatabaseAccessor
    {
        private readonly Settings.DatabaseSettings _databaseSettings;
        private readonly DocumentStoreCache _documentStoreCache;

        public DatabaseAccessor(Settings settings, DocumentStoreCache documentStoreCache)
        {
            _documentStoreCache = documentStoreCache;
            _databaseSettings = settings.Database;
        }

        public string GetFirstDatabaseUrl()
        {
            return _databaseSettings.Urls[0];
        }

        private IAsyncDocumentSession GetSession(Guid userId)
        {
            var databaseName = DatabaseName.For(userId);
            var documentStore = _documentStoreCache.GetEntry(userId);
            return documentStore.OpenAsyncSession(databaseName);
        }

        public void EnsureUserDatabaseExists(Guid userId)
        {
            var documentStore = _documentStoreCache.GetEntry(userId);

            if (DoesDatabaseExist(documentStore))
                return;

            CreateDatabase(documentStore);
        }

        private bool DoesDatabaseExist(IDocumentStore documentStore)
        {
            try
            {
                documentStore.Maintenance.ForDatabase(documentStore.Database).Send(new GetStatisticsOperation());
                return true;
            }
            catch (DatabaseDoesNotExistException)
            {
                return false;
            }
        }

        private void CreateDatabase(IDocumentStore documentStore)
        {
            try
            {
                var databaseRecord = new DatabaseRecord(documentStore.Database);
                var operation = new CreateDatabaseOperation(databaseRecord);
                documentStore.Maintenance.Server.Send(operation);
            }
            catch (ConcurrencyException)
            {
                // The database was already created before calling CreateDatabaseOperation
            }
        }

        public async Task EnsureDocumentExists<T>(Guid userId, string documentId, T document)
        {
            using (var session = GetSession(userId))
            {
                var doc = await session.LoadAsync<T>(documentId);
                if (doc == null)
                {
                    await session.StoreAsync(document, documentId);
                    await session.SaveChangesAsync();
                }
            }
        }
        
        public async Task SaveDocument<T>(Guid userId, T document) 
        {
            using (var session = GetSession(userId))
            {
                await session.StoreAsync(document);
                await session.SaveChangesAsync();
            }
        }

        public async Task DeleteDatabase(Guid userId)
        {
            var documentStore = _documentStoreCache.GetEntry(userId);
            await DeleteDatabase(documentStore);
        }

        private Task DeleteDatabase(IDocumentStore documentStore)
        {
            var operation = new DeleteDatabasesOperation(documentStore.Database, hardDelete: true);
            return documentStore.Maintenance.Server.SendAsync(operation);
        }

        public void EnsureFileExists(string filePath, string fileName, int size)
        {
            var neededFile = Path.Combine(filePath, fileName);

            if (File.Exists(neededFile))
                return;

            CreateDirectoryIfDoesNotExist(filePath);

            using (var fileStream = File.Create(neededFile))
            using (var binaryWriter = new BinaryWriter(fileStream, Encoding.UTF8))
            {
                for (int i = 0; i < size; i++)
                {
                    binaryWriter.Write(i);
                }
            }
        }

        private void CreateDirectoryIfDoesNotExist(string directoryPath)
        {
            if (Directory.Exists(directoryPath) == false)
                Directory.CreateDirectory(directoryPath);
        }
    }
}
